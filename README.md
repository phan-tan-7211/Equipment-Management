<div align="center">

# <a href="https://phantan.com">CEV</a>™

<a href="https://phantan.com"><img src="public/images/brand/icons/CEVphantanIcon-Purple-Medium.png" alt="CEV™ Logo" width="150" /></a>

![Version](https://img.shields.io/badge/version-3.32.0-blue?style=for-the-badge)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-%2344a833.svg?style=for-the-badge&logo=vitest&logoColor=white)

![License](https://img.shields.io/badge/license-Proprietary-lightgrey?style=for-the-badge)

</div>

---

## Overview

CEV™ is a QR-first equipment and maintenance management app, built with React and Supabase, supporting IATF 16949 TPM processes.

## Key features

* QR codes open equipment records.
* Create, assign, and track work orders.
* Fleet Map shows locations on Google Maps.
* Organization and team roles control who can see and change what.
* Supabase Realtime pushes live updates.
* Public `/privacy-request` intake plus a DSR case workflow.
* Scan and location flows honor the user-level "Limit sensitive personal information" setting.
* Public `/right-to-repair` stance: independent repair is supported, and CEVphantanwill not hold shop records hostage.
* Public `/releases` page summarizes published release notes from `CHANGELOG.md`.

## Documentation

Detailed documentation is located in the [`/docs`](./docs/README.md) directory:

* **Getting started.** [Setup Guide](./docs/technical/setup.md) and [Developer Onboarding](./docs/getting-started/developer-onboarding.md)
* **Architecture.** [System Architecture](./docs/technical/architecture.md) and [Database Schema](./docs/technical/architecture.md#database-schema)
* **Guides.** [Workflows](./docs/guides/workflows.md) and [Permissions](./docs/guides/permissions.md)
* **Operations.** [Deployment](./docs/ops/deployment.md), [Migrations](./docs/ops/migrations.md), [Local Supabase Development](./docs/ops/local-supabase-development.md), [QuickBooks OAuth](./docs/ops/quickbooks-oauth.md), [DSR Compliance Runbook](./docs/ops/dsr-compliance-runbook.md), and [Disaster Recovery](./docs/ops/disaster-recovery.md)
* **Demo operations.** [Demo Recording Baseline](./dev/DEMO-RECORDING.md) and [Demo System v2 Runbook](./dev/DEMO-SYSTEM-V2.md)

## Prerequisites (accounts and services)

CEVphantanuses external services. For exact environment variables and where they’re used, see [`.env.example`](./.env.example) (source of truth) and the [Setup Guide](./docs/technical/setup.md).

**Local development:** Install a Node.js version that satisfies `engines.node` in [`package.json`](./package.json). The [Setup Guide](./docs/technical/setup.md) covers **npm-only** installs, Docker Desktop for local Supabase, and pinned CLI usage (`npx supabase`, `npm run deploy:vercel`).

**Required (to run the core app):**

* **Supabase**: Create a project (URL + anon key) and configure Supabase Auth (email/password; optionally Google).

**Optional (feature-dependent):**

* **Resend**: Invitation emails (`RESEND_API_KEY`).
* **Google sign-in (Supabase Auth provider)**: Google OAuth app + provider config in Supabase.
* **Google Workspace integration**: Google Cloud OAuth client + Admin SDK API enabled (directory sync).
* **Google Picker (for Google Docs destination selection)**: Browser API key + Google Cloud project number, using the same OAuth web client as Google Workspace (`VITE_GOOGLE_PICKER_API_KEY`, `VITE_GOOGLE_PICKER_APP_ID`, `VITE_GOOGLE_WORKSPACE_CLIENT_ID`) in the same Google Cloud project. Do not create a separate Picker OAuth client (`VITE_GOOGLE_PICKER_CLIENT_ID` is not used).
* **QuickBooks Online**: Intuit developer app + OAuth credentials (feature-flagged).
* **Google Maps**: Fleet Map feature.
* **hCaptcha**: Bot protection on signup.
* **hCaptcha (privacy requests)**: Bot protection for `/privacy-request` when `VITE_HCAPTCHA_SITEKEY` and `HCAPTCHA_SECRET_KEY` are configured.
* **Web Push**: VAPID keys for push notifications.

## Quick start

1. **Clone & Install**

    ```bash
    git clone https://github.com/CEVphantan
    cd CEVphantan&& npm i
    ```

    > Note: This repo intentionally installs `xlsx` from `cdn.sheetjs.com` (not npm registry). Ensure your CI and network policy allow access to that host during `npm install`.

2. **Configure Environment**
    Preferred: if you have access, use 1Password CLI + `.\dev\dev-start.bat` so env files are synced automatically.

    ```powershell
    op --version
    .\dev\dev-start.bat                    # full stack (Supabase + functions + Vite)
    .\dev\dev-setup-cursor-mcp.bat         # optional: refresh Cursor MCP config
    ```

    Manual fallback:

    ```bash
    cp .env.example .env
    ```

    > See [Setup Guide](./docs/technical/setup.md) for required API keys.

3. **Run Development Server**

    ```powershell
    .\dev\dev-start.bat
    ```

### Git Worktrees (Cursor-friendly)

When working from a git worktree, copy env files from your canonical checkout:

```powershell
.\dev\bootstrap-worktree-env.ps1 -SourcePath "<canonical-repo-path>"
```

Add `-InstallDependencies` to run `npm ci` as part of bootstrap.

## Testing

```bash
npm run test          # Run unit tests
npm run test:coverage # Run with coverage report

```

## License

Copyright © 2026 <a href="https://phantan.com">Phan Tan</a>. All rights reserved.

