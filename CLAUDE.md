# Equipment-Management AI Development Workflow

This repository includes the ai-dev-tasks workflow adapted for Claude Code.

## Commands

- `/create-prd` — turn a feature request into a PRD and save it under `/tasks`.
- `/generate-tasks` — read a PRD, inspect the current codebase, and generate implementation tasks.
- `/process-task-list` — implement the task list one sub-task at a time, update checkboxes, test, and pause for approval between sub-tasks.

## Recommended workflow

1. Run `/create-prd` and describe the feature.
2. Answer the clarification questions.
3. Run `/generate-tasks tasks/prd-<feature>.md`.
4. Review the parent tasks and reply `Go` when they are correct.
5. Run `/process-task-list tasks/tasks-prd-<feature>.md`.
6. Review each completed sub-task before allowing the next one.

## Repository rules

- Preserve existing architecture and conventions unless the PRD explicitly requires a change.
- Inspect relevant existing code before creating new abstractions.
- Do not remove existing behavior unless it is explicitly in scope.
- Keep `tasks/*.md` updated as implementation progresses.
- Run the repository's actual build/test commands before considering a parent task complete.
- For this Vite project, verify production build with `npm run build` when applicable.
