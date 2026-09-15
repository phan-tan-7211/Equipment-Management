#!/usr/bin/env node
/**
 * Poll Vercel until the deployment for the requested commit/branch is READY.
 * Production target IDs are intentionally NOT hard-coded here; GitHub Actions
 * injects them from the `production` Environment.
 *
 * Required env:
 *   VERCEL_TOKEN
 *   VERCEL_TEAM_ID
 *   VERCEL_PROJECT_ID
 *   GITHUB_SHA or VERCEL_COMMIT_SHA
 *
 * Optional env:
 *   VERCEL_BRANCH — default main
 *   VERCEL_POLL_INTERVAL_SEC — default 20
 *   VERCEL_WAIT_TIMEOUT_MINUTES — default 45
 *   VERCEL_FETCH_TIMEOUT_MS — default 45000
 */

function usage() {
  process.stdout.write(`Usage: wait-for-vercel-deployment.mjs

Required environment:
  VERCEL_TOKEN
  VERCEL_TEAM_ID
  VERCEL_PROJECT_ID
  GITHUB_SHA / VERCEL_COMMIT_SHA

Optional environment:
  VERCEL_BRANCH                Default: main
  VERCEL_POLL_INTERVAL_SEC     Default: 20
  VERCEL_WAIT_TIMEOUT_MINUTES  Default: 45
  VERCEL_FETCH_TIMEOUT_MS      Default: 45000
`);
}

function deploymentPublicUrl(deployment) {
  const value = deployment?.url || '';
  if (!value) return '';
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
}

function commitRefMatches(meta, branch) {
  const ref = meta?.githubCommitRef || '';
  return ref === branch || ref === `refs/heads/${branch}`;
}

function shaMatches(meta, sha) {
  return (meta?.githubCommitSha || '') === sha;
}

function terminalErrorStates(deployments, sha, branch) {
  return deployments.filter((deployment) => {
    const state = deployment.readyState || deployment.state || '';
    return (
      ['ERROR', 'CANCELED', 'DELETED'].includes(state) &&
      shaMatches(deployment.meta || {}, sha) &&
      commitRefMatches(deployment.meta || {}, branch)
    );
  });
}

function pickReadyDeployment(deployments, sha, branch) {
  const candidates = deployments.filter((deployment) => {
    const state = deployment.readyState || deployment.state || '';
    const meta = deployment.meta || {};
    return state === 'READY' && shaMatches(meta, sha) && commitRefMatches(meta, branch);
  });

  if (candidates.length === 0) return null;

  const sortNewest = (a, b) => (b.createdAt || b.created || 0) - (a.createdAt || a.created || 0);
  const previewCandidates = candidates.filter((deployment) => deployment.target == null).sort(sortNewest);
  if (previewCandidates.length > 0) return previewCandidates[0];
  return candidates.sort(sortNewest)[0];
}

async function listDeployments({ token, teamId, projectId, sha, branch, timeoutMs }) {
  const url = new URL('https://api.vercel.com/v6/deployments');
  url.searchParams.set('teamId', teamId);
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('sha', sha);
  url.searchParams.set('branch', branch);
  url.searchParams.set('limit', '25');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    const text = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        transient: response.status === 429 || response.status >= 500,
        detail: `Vercel API ${response.status}: ${text.slice(0, 400)}`,
      };
    }

    try {
      return { ok: true, deployments: JSON.parse(text).deployments || [] };
    } catch {
      return { ok: false, transient: true, detail: `invalid JSON (${text.slice(0, 200)})` };
    }
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'name' in error && error.name === 'AbortError'
        ? `request timeout after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    return { ok: false, transient: true, detail };
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeDeploymentUrl(raw) {
  try {
    const parsed = new URL(String(raw).replace(/[\r\n]/g, ''));
    if (parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.endsWith('.vercel.app') && !parsed.hostname.endsWith('.equipqr.app')) return null;
    return `https://${parsed.hostname}${parsed.pathname || '/'}${parsed.search || ''}`;
  } catch {
    return null;
  }
}

function safeDeploymentId(raw) {
  const match = /^([A-Za-z0-9_-]+)$/.exec(String(raw).replace(/[\r\n]/g, ''));
  return match ? match[1] : null;
}

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    process.stderr.write(
      `::error title=wait-for-vercel-deployment::${name} is required. Configure GitHub Environment 'production'.\n`,
    );
    return null;
  }
  return value;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    usage();
    process.exit(0);
  }

  const token = requiredEnv('VERCEL_TOKEN');
  const teamId = requiredEnv('VERCEL_TEAM_ID');
  const projectId = requiredEnv('VERCEL_PROJECT_ID');
  const sha = (process.env.GITHUB_SHA || process.env.VERCEL_COMMIT_SHA || '').trim();
  if (!sha) {
    process.stderr.write(
      '::error title=wait-for-vercel-deployment::GITHUB_SHA / VERCEL_COMMIT_SHA is required.\n',
    );
  }
  if (!token || !teamId || !projectId || !sha) process.exit(1);

  const branch = (process.env.VERCEL_BRANCH || 'main').trim() || 'main';
  const intervalSec = Math.max(5, Number.parseInt(process.env.VERCEL_POLL_INTERVAL_SEC || '20', 10) || 20);
  const timeoutMin = Math.max(1, Number.parseInt(process.env.VERCEL_WAIT_TIMEOUT_MINUTES || '45', 10) || 45);
  const fetchTimeoutMs = Math.max(5000, Number.parseInt(process.env.VERCEL_FETCH_TIMEOUT_MS || '45000', 10) || 45000);
  const deadline = Date.now() + timeoutMin * 60_000;
  let attempt = 0;

  process.stderr.write(
    `Polling Vercel for READY deployment: team=${teamId} project=${projectId} branch=${branch} sha=${sha.slice(0, 7)}\n`,
  );

  while (Date.now() < deadline) {
    attempt += 1;
    const listed = await listDeployments({ token, teamId, projectId, sha, branch, timeoutMs: fetchTimeoutMs });

    if (!listed.ok) {
      if (!listed.transient) {
        process.stderr.write(`::error title=wait-for-vercel-deployment::${listed.detail}\n`);
        process.exit(1);
      }
      process.stderr.write(
        `::warning title=wait-for-vercel-deployment::Transient Vercel API failure (attempt ${attempt}): ${listed.detail}. Retrying...\n`,
      );
      await sleep(intervalSec * 1000);
      continue;
    }

    const failed = terminalErrorStates(listed.deployments, sha, branch);
    if (failed.length > 0) {
      const deployment = failed[0];
      const message = deployment.errorMessage || deployment.errorCode || 'deployment failed';
      process.stderr.write(
        `::error title=wait-for-vercel-deployment::Vercel deployment failed (${deployment.readyState || deployment.state}): ${message}\n`,
      );
      process.exit(1);
    }

    const ready = pickReadyDeployment(listed.deployments, sha, branch);
    if (ready) {
      const url = safeDeploymentUrl(deploymentPublicUrl(ready));
      const id = safeDeploymentId(ready.uid || ready.id || '');
      if (!url) {
        process.stderr.write(
          '::error title=wait-for-vercel-deployment::READY deployment URL failed validation.\n',
        );
        process.exit(1);
      }

      process.stdout.write(`deployment_url=${url}\n`);
      if (id) process.stdout.write(`deployment_id=${id}\n`);
      process.stderr.write(`::notice::Vercel deployment READY: ${url}\n`);
      process.exit(0);
    }

    if (attempt === 1 || attempt % 5 === 0) {
      process.stderr.write(`[wait] attempt ${attempt}: no READY deployment yet for this commit\n`);
    }
    await sleep(intervalSec * 1000);
  }

  process.stderr.write(
    `::error title=wait-for-vercel-deployment::Timed out after ${timeoutMin}m waiting for READY deployment for ${sha.slice(0, 7)} on ${branch}.\n`,
  );
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(
    `::error title=wait-for-vercel-deployment::${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
