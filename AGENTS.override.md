# ZNTEQR — ChatGPT / Codex Cloud Instructions

These instructions are optimized for ChatGPT/Codex working directly with this GitHub repository.
They intentionally override the root `AGENTS.md`, which is primarily a Cursor-on-Windows handbook.

## 1. Context discipline

- Do not load the root `AGENTS.md` unless the current task specifically needs Cursor/local-machine instructions.
- Do not load `.cursor/rules/**` or long `docs/ops/**` runbooks preemptively.
- Read only the files and documentation required for the current task.
- If the task concerns release, deployment, secrets, Supabase operations, Vercel, OAuth, local Windows tooling, or Cursor workflows, read the relevant runbook before acting.

## 2. One request = one bounded task

Implement only the user's explicit objective and direct prerequisites required to make it work.

Do not turn discoveries into new requirements. In particular, do not automatically fix:

- unrelated bugs;
- cleanup opportunities;
- refactoring opportunities;
- optional improvements;
- unrelated test gaps;
- dependency upgrades not required by the task.

Out-of-scope findings may be reported briefly, but must not be modified without user authorization.

## 3. Smallest coherent patch

- Prefer the smallest correct change that satisfies the request.
- Match existing project patterns before introducing new architecture.
- Every changed file and meaningful changed hunk must trace to the current task.
- Preserve unrelated user work.
- Do not reformat, rename, or reorganize unrelated code.
- If completion requires meaningful scope expansion, stop and explain the required expansion instead of silently proceeding.

## 4. Verification and stop condition

Before editing, identify the requested outcome and concrete acceptance criteria.

During implementation:

- run focused checks first;
- do not repeatedly rerun an unchanged passing check;
- run broader verification only when appropriate for the changed surface;
- never claim a test, build, CI check, browser check, or deployment succeeded unless evidence was actually observed.

### Cloud runtime verification

- Treat a connector-only ChatGPT/Codex Cloud session with no mounted repository checkout as a normal supported mode, not a condition that must be repaired.
- Attempt at most one lightweight local-availability probe when verification would benefit from a checkout. If the repository is not mounted, or that probe shows outbound/DNS access to GitHub is unavailable, do not retry cloning, fetching, installing, or alternate network workarounds just to obtain local verification.
- In that mode, continue with the available remote evidence: GitHub file/diff/compare reads, commit and branch state, CI/check runs, and deployment status where accessible.
- If executable local checks are unavailable, state that plainly instead of spending extra turns trying to manufacture a local environment, and provide the exact maintainer-side commands needed for type-check, tests, build, or preview.
- Only run local verification when the repository is already available in the runtime or can be accessed without a network workaround.

### Fast maintainer handoff mode

- Activation keyword: `FAST-HANDOFF` (case-insensitive). It must appear explicitly in the user's request. Without this keyword, follow the normal workflow in this file and the applicable repository runbooks.
- Use this mode only for ordinary bounded feature/fix implementation. It never bypasses safety requirements for destructive data changes, secrets, production deploys, migrations that require validation, force-push/history rewrite, or other explicitly high-risk operations.
- When `FAST-HANDOFF` is active: implement the requested change, perform one scoped diff/self-review, create one coherent task commit, push the working feature branch to `origin`, then STOP and hand the branch to the maintainer for local testing.
- In this mode, do not spend time on executable local verification in an unavailable cloud checkout, waiting for GitHub CI, waiting for Vercel, PR screenshots/video evidence, PR creation, merge, release/version bumps, or deployment unless the user explicitly asks for one of those in the same request.
- The handoff response must state the exact branch and pushed commit and clearly mark executable checks as not run when applicable.
- When the code being tested is already on `main` (including after an explicitly requested immediate merge), the FAST-HANDOFF response must output this exact command block as the maintainer pull/build/preview handoff, without adding alternate Git/test commands:

```powershell
git pull --ff-only origin main
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4174 --strictPort
```

- If the work has not been merged to `main` yet, do not claim the block above tests the feature branch. State the feature branch and pushed commit and wait for the maintainer's merge authorization or provide a branch-specific pull command only when explicitly requested.
- If the maintainer reports `FAIL`, continue on the same branch, make the smallest correction, create and push a new commit, and return a new exact-commit test handoff. Do not open or merge a PR.
- If the maintainer reports `PASS` or `OK` for that `FAST-HANDOFF` branch, treat that as authorization to proceed with the repository's normal publication/PR/merge workflow for the same branch. Run any required remote publication gates at that stage unless the maintainer explicitly instructs an immediate merge or another narrower action.

Passing the requested acceptance criteria is a STOP CONDITION.
Once the requested behavior is verified, stop modifying the code.

## 5. Retry budget

For the same underlying failure, allow at most two implementation/fix attempts.

Attempt 1: diagnose, make the smallest reasonable fix, verify.

Attempt 2: reconsider the cause using new evidence, make one coherent correction, verify.

If the same substantive problem remains after attempt 2, STOP. Do not automatically start attempt 3.
Report what failed, what was tried, the evidence, and the recommended next action.

## 6. Review budget and convergence

Perform at most one normal final self-review.
Review only:

- the original requested behavior;
- regressions directly introduced by the patch;
- correctness or security defects introduced by the patch;
- whether the patch stayed within scope.

A review finding is not automatically authorization for additional work.

Normal maximum cycle:

`IMPLEMENT -> VERIFY -> REVIEW -> one in-scope CORRECTION if needed -> VERIFY`

If substantive blockers remain after that correction, STOP SERIAL PATCHING.
Do not continue `fix -> review -> fix -> review` loops.
Instead report the blocker, re-plan, or request one specific user decision.

## 7. GitHub and publication safety

- Do not merge, enable auto-merge, force-push, rewrite shared history, delete branches, deploy, or change repository/settings/secrets unless explicitly authorized.
- For ordinary feature/fix publication, `preview` is the integration target; production promotion to `main` is a separate release action.
- Do not create duplicate branches or PRs for work that already has an active branch/PR.
- Existing PR continuation must preserve the exact intended branch and useful published work.

## 8. When task-specific runbooks are required

Read the relevant existing documentation only when the task touches that area:

- branching/release: `.cursor/rules/branching.mdc`, `docs/ops/git-and-deploy.md`
- PR/CI publication: `.cursor/rules/pr-merge-ready-workflow.mdc`, `.cursor/rules/pr-ci-gate-before-open.mdc`
- secrets/access: root `AGENTS.md`, `docs/ops/agent-secrets-and-access.md`
- local Windows dev stack: `.cursor/rules/dev-stack-lifecycle.mdc`
- Supabase/cloud-agent operations: the applicable `docs/ops/**` runbook

Do not read these just because they exist.

## 9. Module-scoped i18n

For an i18n-only task, work only on the named module and its direct i18n registration.
Follow the repository's existing resource and `I18nProvider` patterns; do not install
Claude/Cursor skills or introduce a translation service merely to apply these rules.

- Compare the module's source keys with the current branch and translate only new or meaningfully changed UI text. Reuse valid existing translations; do not rewrite unrelated keys.
- Keep VI / EN / KO key sets aligned and preserve each interpolation token, nested reference, and formatting marker across locales. Translate meaning in the UI context; never use an untranslated source string as a placeholder for an unfinished locale.
- Translate presentation text only. Preserve DB enums, status codes, IDs, persisted content, API payloads, and business logic.
- Before finishing, inspect the scoped diff for unrelated files and check key parity, missing or empty translations, and placeholder parity. Run focused lint/tests where available; report checks actually run.
- Static i18n verification does not require screenshots or MP4. Use a browser check only when the task changes interactions or layout and it would verify that change.

## 10. Final response

When finished, state concisely:

- what changed;
- which files changed;
- what verification was actually performed and its result;
- any remaining blocker or material risk.

Do not add a list of optional improvements unless they materially affect the requested task.
