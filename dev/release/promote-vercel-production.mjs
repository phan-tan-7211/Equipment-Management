#!/usr/bin/env node
/**
 * Promote a READY Vercel deployment to production traffic (equipqr.app).
 * Production target IDs are intentionally NOT hard-coded here; GitHub Actions
 * injects them from the `production` Environment.
 *
 * Required env:
 *   VERCEL_TOKEN
 *   VERCEL_TEAM_ID
 *   VERCEL_PROJECT_ID
 *   VERCEL_DEPLOYMENT_URL or VERCEL_DEPLOYMENT_ID
 *
 * Optional env:
 *   VERCEL_BRANCH — default main
 *   GITHUB_SHA / VERCEL_COMMIT_SHA — post-promote commit verification
 *   VERCEL_PROMOTE_TIMEOUT — default 5m
 *   VERCEL_VERIFY_TIMEOUT_MS — default 60000
 *   VERCEL_FETCH_TIMEOUT_MS — default 15000
 *   VERCEL_POLL_INTERVAL_MS — default 5000
 */

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VERCEL_CLI = 'vercel@51.6.1';

function usage() {
  process.stdout.write(`Usage: promote-vercel-production.mjs

Required environment:
  VERCEL_TOKEN
  VERCEL_TEAM_ID
  VERCEL_PROJECT_ID
  VERCEL_DEPLOYMENT_URL / VERCEL_DEPLOYMENT_ID

Optional environment:
  VERCEL_BRANCH                     Default: main
  GITHUB_SHA / VERCEL_COMMIT_SHA   Optional commit verification
  VERCEL_PROMOTE_TIMEOUT           Default: 5m
  VERCEL_VERIFY_TIMEOUT_MS         Default: 60000
  VERCEL_FETCH_TIMEOUT_MS          Default: 15000
  VERCEL_POLL_INTERVAL_MS          Default: 5000
`);
}

function deploymentPromoteRefFromEnv() {
  const url = (process.env.VERCEL_DEPLOYMENT_URL || '').trim();
  if (url) return url;
  return (process.env.VERCEL_DEPLOYMENT_ID || '').trim();
}

function commitRefMatches(meta, branch) {
  const ref = meta?.githubCommitRef || '';
  return ref === branch || ref === `refs/heads/${branch}`;
}

function deploymentPublicUrl(deployment) {
  const value = deployment?.url || '';
  if (!value) return '';
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
}

function deploymentCommitSha(deployment) {
  const metaSha = deployment?.meta?.githubCommitSha;
  if (typeof metaSha === 'string' && metaSha.trim()) return metaSha.trim();
  const gitSourceSha = deployment?.gitSource?.sha;
  return typeof gitSourceSha === 'string' ? gitSourceSha.trim() : '';
}

function deploymentState(deployment) {
  return deployment?.readyState || deployment?.state || '';
}

function deploymentTarget(deployment) {
  return deployment?.target || '';
}

function deploymentId(deployment) {
  return deployment?.uid || deployment?.id || '';
}

function deploymentCreatedAt(deployment) {
  return deployment?.createdAt || deployment?.created || 0;
}

function formatShortSha(sha) {
  return sha ? sha.slice(0, 7) : 'unknown';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listDeployments({ token, teamId, projectId, target, timeoutMs }) {
  const url = new URL('https://api.vercel.com/v7/deployments');
  url.searchParams.set('teamId', teamId);
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('target', target);
  url.searchParams.set('limit', '10');

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

    return { ok: true, deployments: JSON.parse(text).deployments || [] };
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

export function pickProductionDeployment(deployments, branch) {
  const productionDeployments = deployments.filter((deployment) => deploymentTarget(deployment) === 'production');
  if (productionDeployments.length === 0) return null;

  const branchMatches = branch
    ? productionDeployments.filter((deployment) => commitRefMatches(deployment?.meta || {}, branch))
    : [];
  const candidates = branchMatches.length > 0 ? branchMatches : productionDeployments;

  return [...candidates].sort((a, b) => deploymentCreatedAt(b) - deploymentCreatedAt(a))[0];
}

export function evaluateProductionDeployment({ deployment, sha }) {
  if (!deployment) {
    return { ok: false, detail: 'No production deployment found for post-promote verification.' };
  }

  const target = deploymentTarget(deployment);
  if (target !== 'production') {
    return { ok: false, detail: `Promoted deployment target is "${target || 'unset'}", expected production.` };
  }

  const state = deploymentState(deployment);
  if (state !== 'READY') {
    return { ok: false, detail: `Promoted deployment not READY (${state || 'unknown'}).` };
  }

  if (!sha) return { ok: true, detail: '' };

  const actualSha = deploymentCommitSha(deployment);
  if (!actualSha) {
    return { ok: false, detail: 'Promoted deployment is missing commit metadata for post-promote verification.' };
  }

  if (actualSha !== sha) {
    return {
      ok: false,
      detail: `Promoted deployment commit mismatch: expected ${formatShortSha(sha)}, got ${formatShortSha(actualSha)}.`,
    };
  }

  return { ok: true, detail: '' };
}

export async function verifyProductionDeployment({
  token,
  teamId,
  projectId,
  branch,
  sha,
  verifyTimeoutMs,
  fetchTimeoutMs,
  pollIntervalMs,
}) {
  const deadline = Date.now() + verifyTimeoutMs;
  let lastFailure = 'No production deployment found for post-promote verification.';

  while (Date.now() < deadline) {
    const listed = await listDeployments({
      token,
      teamId,
      projectId,
      target: 'production',
      timeoutMs: fetchTimeoutMs,
    });

    if (!listed.ok) {
      if (!listed.transient) {
        process.stderr.write(
          `::error title=promote-vercel-production::Post-promote verification failed: ${listed.detail}\n`,
        );
        return false;
      }
      lastFailure = `Post-promote verification transient failure: ${listed.detail}`;
    } else {
      const deployment = pickProductionDeployment(listed.deployments, branch);
      const evaluation = evaluateProductionDeployment({ deployment, sha });
      if (evaluation.ok) {
        process.stdout.write(
          `::notice::Verified production deployment ${deploymentId(deployment) || '(no id)'} ${deploymentPublicUrl(deployment) || ''}`.trim() + '\n',
        );
        return true;
      }
      lastFailure = evaluation.detail;
    }

    if (Date.now() + pollIntervalMs >= deadline) break;
    await sleep(pollIntervalMs);
  }

  process.stderr.write(`::error title=promote-vercel-production::${lastFailure}\n`);
  return false;
}

function runVercelPromote({ deploymentRef, token, teamId, timeout }) {
  const args = [
    '--yes',
    VERCEL_CLI,
    'promote',
    deploymentRef,
    '--yes',
    '--timeout',
    timeout,
    '-t',
    token,
    '-S',
    teamId,
    '--non-interactive',
  ];

  process.stdout.write(`Running vercel promote for ${deploymentRef} (timeout ${timeout}, team ${teamId}).\n`);
  const result = spawnSync('npx', args, { stdio: 'inherit', env: process.env });

  if (result.error) {
    process.stderr.write(
      `::error title=promote-vercel-production::Failed to spawn npx: ${result.error.message}\n`,
    );
    return false;
  }
  if (result.status !== 0) {
    process.stderr.write(
      `::error title=promote-vercel-production::vercel promote exited with code ${result.status ?? 'unknown'}.\n`,
    );
    return false;
  }
  return true;
}

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    process.stderr.write(
      `::error title=promote-vercel-production::${name} is required. Configure GitHub Environment 'production'.\n`,
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
  const deploymentRef = deploymentPromoteRefFromEnv();

  if (!deploymentRef) {
    process.stderr.write(
      '::error title=promote-vercel-production::VERCEL_DEPLOYMENT_URL or VERCEL_DEPLOYMENT_ID is required.\n',
    );
  }
  if (!token || !teamId || !projectId || !deploymentRef) process.exit(1);

  const branch = (process.env.VERCEL_BRANCH || 'main').trim() || 'main';
  const timeout = (process.env.VERCEL_PROMOTE_TIMEOUT || '5m').trim() || '5m';
  const sha = (process.env.GITHUB_SHA || process.env.VERCEL_COMMIT_SHA || '').trim();
  const verifyTimeoutMs = Math.max(5000, Number.parseInt(process.env.VERCEL_VERIFY_TIMEOUT_MS || '60000', 10) || 60000);
  const fetchTimeoutMs = Math.max(5000, Number.parseInt(process.env.VERCEL_FETCH_TIMEOUT_MS || '15000', 10) || 15000);
  const pollIntervalMs = Math.max(0, Number.parseInt(process.env.VERCEL_POLL_INTERVAL_MS || '5000', 10) || 5000);

  if (!runVercelPromote({ deploymentRef, token, teamId, timeout })) process.exit(1);

  const verified = await verifyProductionDeployment({
    token,
    teamId,
    projectId,
    branch,
    sha,
    verifyTimeoutMs,
    fetchTimeoutMs,
    pollIntervalMs,
  });
  if (!verified) process.exit(1);

  process.stdout.write(
    '::notice::Vercel production promotion complete — equipqr.app should now serve this build.\n',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(
      `::error title=promote-vercel-production::${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
}
