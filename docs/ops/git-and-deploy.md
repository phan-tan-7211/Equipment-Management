# Git and deploy

ZNTEQR uses Cloudflare Pages for the frontend and Supabase for the backend.
Vercel is retired and must not be added back to the release path.

## Branches

| Git | Role |
|---|---|
| `main` | Production source of truth; Cloudflare Pages serves `https://eqr.zinitek.com`. |
| `preview` | Integration branch for feature work. |
| `feat/*`, `fix/*`, `codex/*` | Short-lived work branches. |

Day-to-day work branches from `origin/preview` and targets `preview`. Production
ships through a controlled `preview` to `main` pull request with the required
release metadata.

## Frontend deployment

Cloudflare Pages is connected to this repository through its Git integration.
It builds the Vite application with `npm run build` and publishes `dist`.
The committed `public/_redirects` and `public/_headers` files define SPA routing,
cache policy, security headers, and route indexing policy.

Cloudflare deployment status is reported as a GitHub check. Use the deployment
URL exposed by that check for commit-specific verification. Do not require a
fixed preview hostname unless one is explicitly configured in Cloudflare.

## Production backend release

On a push to `main`, `.github/workflows/production-release-readiness.yml`:

1. Loads the production Supabase project ref from `.github/deployment-targets.json`.
2. Applies pending migrations with `supabase db push --include-all --yes`.
3. Runs the strict schema drift check.
4. Deploys Supabase Edge Functions.

The workflow requires `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` in the
GitHub `production` environment. Frontend build variables live in Cloudflare
Pages; Edge Function secrets live in Supabase.

## Verification

Before publishing, run the focused tests for the changed surface, `npm run build`,
`npm run verify:spa-routing`, and `git diff --check`. After merging to `main`,
verify both the Cloudflare Pages check and Production Release Readiness.

Historical Vercel migration notes may remain in archived changelog or migration
records. They are not current deployment instructions.
