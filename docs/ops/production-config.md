# Production configuration

Production CI/CD uses GitHub, Vercel, and Supabase directly. 1Password is not part of the production release path.

## Source of truth

Create/use the GitHub Environment named `production`.

### GitHub variables

| Name | Purpose |
|---|---|
| `SUPABASE_PROJECT_REF` | Production Supabase project ref used by migrations and Edge Function deploys. |
| `VERCEL_TEAM_ID` | Vercel team that owns the SPA project. |
| `VERCEL_PROJECT_ID` | Vercel SPA project promoted to `equipqr.app`. |

### GitHub secrets

| Name | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication. |
| `SUPABASE_DB_PASSWORD` | Production database password used by `supabase link` / `db push`. |
| `VERCEL_TOKEN` | Vercel API/CLI token with access to the configured team/project. |

Environment-level values are preferred. Repository-level variables/secrets may be used where a shared value is intentional.

## Runtime configuration

Frontend/build variables such as `VITE_*` are maintained directly in the Vercel project. Backend/Edge Function runtime secrets are maintained directly in Supabase Secrets/project settings.

Do not copy runtime secret values into this repository, PR descriptions, or workflow YAML.

## Release behavior

`.github/workflows/production-release-readiness.yml` fails closed before any production mutation when a required variable or secret is missing. The release scripts do not contain fallback Vercel team/project IDs.

A `403 Not authorized` from Vercel means the configured `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID` do not belong to the same accessible Vercel scope. Correct the GitHub `production` Environment rather than editing release code.

## Rotation / target changes

When Vercel ownership or the production project changes, update the three GitHub production values only. No release-script code change should be necessary.

When rotating tokens/passwords, update the corresponding GitHub secret and the native provider configuration as required. Never commit the value.
