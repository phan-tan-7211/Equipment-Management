# Production configuration

Production CI/CD uses Cloudflare Pages and Supabase. 1Password is not part of the production release path.

## Source of truth

Create/use the GitHub Environment named `production`.

### GitHub variables

| Name | Purpose |
|---|---|
| `SUPABASE_PROJECT_REF` | Production Supabase project ref used by migrations and Edge Function deploys. |

### GitHub secrets

| Name | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication. |
| `SUPABASE_DB_PASSWORD` | Production database password used by `supabase link` / `db push`. |

Environment-level values are preferred. Repository-level variables/secrets may be used where a shared value is intentional.

## Runtime configuration

Frontend/build variables such as `VITE_*` are maintained in the Cloudflare Pages project. Backend/Edge Function runtime secrets are maintained directly in Supabase Secrets/project settings.

Do not copy runtime secret values into this repository, PR descriptions, or workflow YAML.

## Release behavior

`.github/workflows/production-release-readiness.yml` fails closed before any production mutation when a required Supabase variable or secret is missing. Cloudflare Pages deploys the frontend from `main` through its Git integration.

## Rotation / target changes

When rotating tokens/passwords, update the corresponding GitHub secret and the native provider configuration as required. Never commit the value.
