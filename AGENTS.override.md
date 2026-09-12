# EquipQR — ChatGPT / Codex Instructions

These are the repository's task instructions for ChatGPT/Codex. The root `AGENTS.md` points here.

## 1. Context discipline

- Do not load long `docs/ops/**` runbooks preemptively.
- Read only the files and documentation required for the current task.
- If the task concerns release, deployment, secrets, Supabase operations, Vercel, OAuth, local Windows tooling, or repository workflows, read the relevant runbook before acting.

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

- branching/release: `docs/ops/git-and-deploy.md`
- PR/CI publication: `docs/ops/ci-cd-pipeline.md`, `CONTRIBUTING.md`
- secrets/access: `docs/ops/agent-secrets-and-access.md`
- local development: `docs/getting-started/developer-onboarding.md`
- Supabase/cloud-agent operations: the applicable `docs/ops/**` runbook

Do not read these just because they exist.

## 9. Final response

When finished, state concisely:

- what changed;
- which files changed;
- what verification was actually performed and its result;
- any remaining blocker or material risk.

Do not add a list of optional improvements unless they materially affect the requested task.