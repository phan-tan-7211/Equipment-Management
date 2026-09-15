# Production config migration checklist

This short checklist accompanies the move away from 1Password in the production release path.

Before merging the centralization PR, configure GitHub Environment `production` with:

Variables:
- `SUPABASE_PROJECT_REF`
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`

Secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `VERCEL_TOKEN`

The Vercel token must have access to the exact team/project represented by the two Vercel variables.

After those values are present, merge the PR and confirm `Production Release Readiness` passes configuration validation, Supabase migration/drift checks, Vercel wait/promote, and Edge Function deployment.

Once production is green, the removed `dev/sync-vercel-from-1password.ps1` must not be restored. Vercel runtime variables belong in Vercel, and Supabase runtime secrets belong in Supabase.
