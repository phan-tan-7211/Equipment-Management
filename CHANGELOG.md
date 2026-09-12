# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to EquipQR by ZNT LLC will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries through 3.28.0 are more verbose than the current policy. Newer notes are short customer-facing outcomes. Editorial rules live in `.cursor/rules/changelog.mdc`.

## [Unreleased]

- **Inventory list localization** — Inventory list and browse controls now support Vietnamese, English, and Korean while preserving existing stock-health presentation copy.

## [3.32.1] - 2026-09-12

### Changed

- **Equipment localization** — Equipment workflows now support Vietnamese, English, and Korean across lists, details, forms, QR scanning, PM, media, parts, filters, sorting, working hours, and equipment groups.

## [3.32.0] - 2026-09-06

### Added

- **Work order calendar (#1530)** — Desktop planners can switch Work Orders to a month, week, or day calendar, drag due dates, and set optional due times.
- **Work order list pages (#1534)** — The Work Orders list now pages on the server so large organizations no longer load every work order at once.
- **PM template groups (#1536)** — EquipQR and organization sections on PM Templates can collapse. EquipQR starts closed when the organization already has a custom template.

### Changed

- **Work order list toolbar** — The desktop list no longer shows a filtered/total count beside search; paging still shows how many work orders are in view.

### Fixed

- **Calendar panel close (#1533)** — The work-order side panel X now dismisses the panel.
- **Calendar create leftover** — Cancelling a new work order from a calendar slot no longer leaves a ghost event on the grid.

## [3.31.0] - 2026-09-02

### Changed

- **Dependency and security refresh** — Production now ships with the latest vetted dependency maintenance from the preview train.

## [3.30.0] - 2026-08-29

### Added

- **Public releases page (#1460)** — The Legal footer version link now opens a public `/releases` page with build-time release notes from the EquipQR changelog.

### Changed

- **Work order next steps stay on the phone** — Field technicians can act from the page without opening quick actions, and managers can revert locked work orders or reach customer contacts on phone-width layouts.
- **QR download menu** — Equipment, work order, and Quick Form QR dialogs now offer PNG or JPG downloads from a single menu, with How to use collapsed by default.

### Fixed

- **PM checklist section headers stay scannable on work orders (#1482)** — Multi-section PM checklists now show clear section headers with progress and flagged counts.
- **Dashboard hard loads keep the app shell visible (#1472)** — Reloading or directly opening dashboard routes now preserves the sidebar and header while content skeletons load.
- **Mobile overdue invoice badges keep work-order numbers visible (#1480)** — Phone-width work order details now wrap overdue invoice badges instead of clipping invoice or work-order numbers.
- **Mobile work-order quick actions stop covering details (#1479)** — Phone-width work order details now leave PM, Timeline, and Events & Times readable and tappable above the mobile nav.
- **Work order create errors stay honest** — Creating a work order now accepts blank descriptions and surfaces the real failure message instead of a generic toast.
- **Completed work order edit locks stay honest (#1483)** — Completed work orders now show clear lock messaging for notes, PM general notes, and description edits.
- **Accepted work orders honor existing assignees when starting work (#1481)** — Status Management now enables Start Work from the saved assignee instead of forcing a second picker step.
- **Mobile Start work follows unassigned state (#1481)** — Next step, Change status, and Work order actions now keep Start work visible but disabled with assignee guidance when no assignee is set.
- **Viewer and requestor PM controls stay hidden on work orders (#1495)** — Viewer and requestor team roles no longer see PM management controls on work order details.
- **Team member removal confirm works on team details** — Owners and team managers now get a real confirmation dialog before removing a teammate.
- **Completed work order revert actions are clearly labeled (#1484)** — Completed work orders now separate `Reopen work order` from `Revert PM`, explain each action, and require confirmation.
- **Work order delete stays in the overflow menu (#1485)** — Desktop details keep Export as the primary header action and move delete into the overflow menu, while mobile leaves delete last and low-emphasis.
- **Organization settings page alias (#1469)** — Opening `/dashboard/organization/settings` now renders the Settings form and organization tabs instead of a blank main panel.
- **Starter PM template titles stay readable** — EquipQR starter cards now keep template names readable even when both EquipQR and Protected badges are present.
- **Fleet Map Team HQ marker stays interactive (#1461)** — Clicking a team headquarters marker now keeps the map mounted and opens the team popup.
- **Fleet Map key failures stay on the signed error card (#1461)** — Fleet Map key fetch failures now keep the `Fleet Map Error` card on screen without exposing secret names in a toast.
- **Public 404 for unknown routes (#1470)** — Unknown public URLs now render a public not-found page with header and footer instead of a blank shell.

## [3.29.1] - 2026-08-26

### Fixed

- **Production promote verification follows the serving build** — Release Readiness now verifies the production deployment created by `vercel promote`, so successful promotes and same-SHA reruns no longer stop before Edge Function deploy.

## [3.29.0] - 2026-08-23

### Added

- **Homepage pricing collage** — Four vertical equipment photo strips scroll behind the pricing card on `/`. Reduced motion freezes the first frame.
- **Right to Repair stance** — Public `/right-to-repair` (Legal footer) states EquipQR supports independent repair and will not hold customer records hostage. The page includes a filterable case atlas. It is a stance, not a contract.

### Changed

- **Single Get Started path** — The landing header keeps one primary button. The auth page is a focused sign-in or create-org card with a text switch instead of tabs.
- **Google-first organization signup** — Create-org asks for an organization name, then Google. Email and password stay behind Sign up with email, with a way back to Google.
- **Google-first sign-in** — Sign-in offers Login with Google first. Email and password stay behind Login with Email & Password, with a way back to Google.
- **Homepage rental card icon** — The Equipment rental agencies card uses a construction-yellow bulldozer so the glyph reads on the dark card.
- **Marketing and public docs voice** — Landing, Repair Shops, feature pages, README, and public docs now match the homepage hero.
- **In-repo marketing photos** — Homepage and feature marketing photos now ship with the app so they still load after a local reset. The pricing collage uses a new equipment photo set.

### Fixed

- **Notification taps open the relevant page (#1431)** — Tapping a notification now goes to the matching work order, team, members list, audit log, or reports page instead of a generic organization dump.
- **Marketing footer link underlines** — Landing footer internal and external links now share the same muted color and rest/hover underline treatment.

### Security

- **Cross-org team IDOR (RT-13)** — Team fetch, update, and delete stay in the current organization. A foreign team UUID shows Team not found with no members or Edit Team.
- **Same-org team isolation (RT-19)** — Non-owner/admin users see only membership teams on dashboard widgets, equipment and work-order lists, and direct UUID routes.
- **Public Quick Form flood (RT-03)** — Fail-closed hCaptcha when configured, plus a 10-minute cooldown and hourly cap of 5 per token.
- **Operator check-in same-day reuse (RT-02)** — A second submit on the same UTC day is rejected. Load returns the already-submitted state.
- **Privacy request length (RT-06)** — Name (200) and details (4000) have matching client and server caps, checked before captcha.
- **Wildcard CORS leftovers** — Remaining admin and Google export endpoints use origin-validated CORS instead of `*`.
- **CSP frame-ancestors** — Production CSP includes `frame-ancestors 'self'`.

## [3.28.0] - 2026-08-10

### Added

- **TopBar org logo and team avatar (#1379)** — Dashboard workspace context (`OrganizationSwitcher` topbar variant, `ContextBreadcrumb`, `MobileWorkspaceSwitcher`) shows the organization logo left of the org name and the selected team’s image beside the team label (mobile: side-by-side small avatars). Missing images keep Building/Users icons. Seed mix under `supabase/seed-images/organizations/` and `teams/` (most fixtures have images; Valley, Site Operations, and Customer Service intentionally do not).
- **Cloud Agent ephemeral Supabase stack (#1249)** — Cursor Cloud Agents create a per-session hosted Database Branch, seed Dev Quick Login personas via Auth Admin API (never production / never Docker-local `supabase start`), rewrite `VITE_SUPABASE_*`, and start Vite. Paired teardown + TTL cleanup protect the 50-branch cap; runbook in `docs/ops/cloud-agent-ephemeral-stack.md`.
- **Cookie consent banner (#1386)** — First-visit Accept/Reject notice for cookies and browser storage on landing, auth, public QR, and dashboard shells. Persists `equipqr:cookie-consent`; UI preference storage (including `sidebar:state`) writes only after Accept and is cleared on Reject. Organization hints and a sanitized session cache (no address/coordinates) remain strictly necessary. Privacy Policy §5 documents the consent key and Accept/Reject behavior; hCaptcha and Maps remain available as non-advertising functional widgets.
- **Vitest duration report script (#1349)** — `npm run test:perf:report` aggregates CI/local Vitest JSON results into ranked slow-file and slow-test lists under `tmp/vitest-perf/` for #1314 triage. CI job **Vitest Duration Report** publishes the markdown summary to the Actions job summary and a sticky PR comment listing offenders ≥200ms.
- **Vitest duration CI artifacts (#1349)** — `slowTestThreshold` of 200ms plus default+JSON reporters write per-shard results under `artifacts/vitest-results/`; CI uploads `vitest-results-shard-N` with `if: always()` so failed shards still yield duration data for #1314 triage.
- **Cursed historical timeline fixtures (#1279)** — Permanent anonymized seed org `CURSED_HISTORICAL_FIXTURE Timeline Lab` with legacy accepted-first, multi-event, long in-progress, happy-path contrast, and boundary historical work orders. Unit, pgTAP replace-rejection, and PR evidence e2e coverage pin these shapes so timeline editor/RPC regressions fail in CI. Optional production canary SQL under `scripts/sql/canary_legacy_historical_timeline_accepted_first.sql`.

### Changed

- **Radix popover / dialog family alignment (#1294)** — Bump `@radix-ui/react-popover`, `react-dialog`, `react-alert-dialog`, and `react-slot` to the 1.1.23 / 1.3.3 line and pin shared dismissable/focus/portal primitives via `overrides` so Sheet-nested `MultiSelectActionMenu` popovers open again (Dependabot #1298/#1299 superseded). Menus keep `modal={false}` when nested in Sheets.
- **CodeQL Action 4.37.3 (#1402)** — Bump `github/codeql-action/init` and `analyze` together to `e4fba868…` (v4.37.3) so Security Scan keeps matching init/analyze versions (Dependabot #1399 superseded).
- **Faster Vitest hotspots (#1314 follow-up)** — Restore native PM/photo stubs in `EquipmentQRQuickActions` (real Radix coverage stays in `QRWorkOrderDialog`); stub Reports column/worksheet pickers and ledger date-range; consolidate Privacy/Terms and InventoryItemDetail renders; lighten InventoryList column manager and InventoryItemForm compatibility editor; prefer `userEvent.setup({ delay: null })` / sync asserts in remaining slow suites.
- **DSR Cockpit entry points** — Remove DSR Cockpit from the main sidebar Audit section. Owners/admins open it from **Legal → DSR Cockpit** in the footer or **Settings → Privacy**. Docs and RBAC nav coverage updated to match.
- **Equipment list → details view transitions (#1380, partial)** — Card and table row navigation morph into the equipment details page via the View Transitions API when supported; respects `prefers-reduced-motion`, and details always open scrolled to the top of main content.
- **equipqr.info branding aligned with equipqr.app (#1358)** — VitePress theme mirrors Mission Control HSL tokens (primary, neutrals, semantic status colors), uses `appearance: force-dark` (no light toggle), EquipQR wordmark with secondary Docs label, styles the Open App nav CTA as a primary button (system fonts; no third-party font CSS), honors `prefers-reduced-motion`, and documents token propagation in `docs/ops/deployment.md`.
- **Faster Vitest hotspots (#1355)** — Consolidate Privacy/Terms and Reports happy-path renders; sync `lazyPublicPages` / `lazyDashboardPages` stubs in `App.routes`; stub DateTimePicker calendar + ledger date-range picker; collapse duplicate waitFors in EquipmentQRQuickActions; add focused `QRWorkOrderDialog` coverage for Radix PM Select and photo-picker wiring. Reduces the 2026-07-19 duration-report offenders while keeping #1314 as the umbrella maintainability track.
- **Sibling-colocated Vitest layout (#1333)** — All Vitest suites live next to their subjects as `*.test.*` / `*.spec.*` siblings (no `__tests__/`, no `src/tests/`). Shared harness moves to repo-root `vitest/` (`@vitest-harness/*`). Script/tooling tests colocate under `scripts/`; docs and Vitest config updated for discovery.
- **Dashboard cache invalidation (#1335)** — `invalidateWorkOrderRelated` skips a redundant `dashboard-optimized` invalidate when `equipmentId` is set, since `invalidateEquipmentRelated` already refreshes that query.
- **Offline queue getCounts() (#1325)** — `OfflineQueueService.getCounts()` returns `{ pending, failed, total }` from one localStorage read; single-count helpers reuse it so callers that need multiple counts avoid triple deserialization.
- **Memoize unified permissions (#1323)** — Wrap `equipment`, `workOrders`, `teams`, `inventory`, notes helper, and the hook return of `useUnifiedPermissions` in `useMemo` (keyed on session/auth fields) so dashboard consumers keep referential equality across parent re-renders.
- **Faster component tests (#1314)** — Stabilize `TestProviders` QueryClient across re-renders; mock CSS layout twins and stub heavy ledger tables in the slowest suites; move checklist reorder utils to the unit project; prefer sync `getBy*` / `fireEvent` over async polling and `userEvent` for wiring smokes. Document performance guidance in `.cursor/rules/testing.mdc`. Second pass: speed `InventoryItemDetail`, `EquipmentQRQuickActions`, and `InventoryList` suites (sync assertions, `fireEvent` for dialogs/forms, reserve `userEvent` for Radix Tabs/Select/DropdownMenu).

### Fixed

- **Playwright user E2E ignores Vitest `*.test.ts`** — After `@playwright/test` 1.61, the user-regression config loaded colocated Vitest files under `e2e/user` (default `*.test.ts` discovery) and crashed on `describe` before `@full`/`@critical` filters. Ignore `**/*.test.ts` so only `*.spec.ts` / setup files run.
- **E2E auth seeds cookie consent Accept** — Persona `storageState` from auth setup now persists `equipqr:cookie-consent=accepted` (and dismisses a visible banner) so the cookie consent strip cannot intercept Create Equipment, bottom nav, or FAB clicks.
- **Mobile work-order field QA E2E** — Slow-4G assertion targets the current field-first **Events & Times** control instead of removed “Review & office details” copy.
- **Multi-org E2E team seeds** — Seed Multi Org User onto Apex Heavy Equipment and Metro Rental Fleet teams so org-scoped equipment (CAT 320 / Bobcat S770) is visible under team-based equipment RBAC.
- **Session hydrate re-syncs team memberships** — Cache load aligns `currentOrganizationId` with org preference and re-fetches `get_user_team_memberships` before clearing session loading, so a pinned/changed org cannot leave `teamMemberships: []` and empty the equipment list. E2E `pinContextToOrg` drops `equipqr_session_data` so the preferred org reloads cleanly.
- **Cloud Agent Quick Login password + smoke (#1249 follow-up)** — Ephemeral stack resolves `DEV_LOGIN_PASSWORD` from agent-bootstrap `.env` when `VITE_DEV_TEST_PASSWORD` is absent; Playwright smoke asserts the unique `CAT320GC-CLOUD-AGENT-001` serial so duplicate excavator names do not fail strict mode.
- **Google avatars in TopBar user menu (#1378)** — Resolve current-user avatar as EquipQR `profiles.avatar_url` first, then Google Auth metadata (`avatar_url` / `picture`); wire `UserProfileMenu` trigger and menu header through `useResolvedAvatarUrl` with initials fallback. Deleting an EquipQR upload restores the Google photo when available.
- **Supabase Security Advisor warnings (#1310)** — Drop listing `SELECT` policies on public buckets (`docs-media`, `landing-page-images`, `landing-page-videos`, `organization-logos`); pin `datadog.explain_statement` `search_path` when present; re-lock `SECURITY DEFINER` `EXECUTE` grants to the allowlist (all overloads); revoke `PUBLIC`/`anon` from all public functions (INVOKER + DEFINER) so default-privilege drift cannot reopen unauthenticated RPCs; re-grant `authenticated` on non-trigger INVOKER RPCs; follow-up migration re-asserts the three-token anon surface; revoke default `postgres` function privileges for `anon`/`authenticated` so new RPCs stay deny-by-default. Intentional `anon` surface remains the three token/pre-auth resolvers; submit-operator-check-in stays `service_role` (edge) only.
- **Landing hero Texas flash on cold load (#1364)** — Suspense fallback for lazy GSAP phase chunks is a neutral vertical line (morph start) instead of the Texas static composite; reduced-motion visitors still see Texas + dots; first two phase chunks are warmed on mount for animated visitors only.
- **Signup empty name fallback (#1332)** — Trim signup display names before storing metadata; AuthContext rejects empty/whitespace-only names (no silent email rename), and the signup form keeps showing “Full name is required”.
- **Google OAuth preserves QR pending redirect (#1322)** — `signInWithGoogle` now returns to `/auth` with a validated `?next=` when `pendingRedirect` is set, Auth restores that destination after the OAuth round-trip, and SmartLanding honors `pendingRedirect` instead of always sending authenticated users to the dashboard.
- **Cache batchInvalidate substring false positives (#1321)** — Match query keys by structural prefix arrays instead of `join('-').includes()`, so patterns like equipment/org segments no longer bust unrelated keys such as `work-orders-equipment-…`.
- **Dead cache preload API (#1320)** — Remove `CacheManager.preloadRelatedData()`, which called React Query `prefetchQuery` without a `queryFn` and was an unused silent no-op.
- **Auth cold-load race (#1319)** — Remove the parallel `getSession()` call on `AuthProvider` mount so bootstrap relies only on `onAuthStateChange` / `INITIAL_SESSION`, avoiding non-deterministic session and loading flicker when both paths raced `setSession` / `setIsLoading`.
- **Revert to Accepted refreshes details (#1278)** — After an org admin uses Revert to Accepted on a completed or cancelled work order, the details page invalidates `workOrderKeys.detail` (via `invalidateWorkOrderCaches`) so status, lock warning, and actions update without a hard browser refresh.
- **Revert PM Completion unlocks edit (#1277)** — Org owners/admins reverting a completed PM on a completed (or cancelled) work order also reopen the work order to accepted in one confirmed action, so the checklist is editable again without a separate Revert to Accepted step. Confirm copy matches PM `pending` status and work-order reopen behavior.

## [3.27.0] - 2026-07-17

### Changed

- **Feat → preview → main train restored (#1282)** — Day-to-day work merges into git `preview`; production ships via controlled `preview` → `main`. Version bumps and empty `[Unreleased]` are enforced only on promote to `main`; preview PRs accumulate Unreleased notes and must not bump `package.json`. `preview.equipqr.app` tracks the integration branch via normal Vercel deploys (`preview-domain-alias.yml` fast-forward from `main` removed). CI runs on PRs to `preview` and `main`, with split Release Metadata / Preview Release Metadata jobs. Dependabot targets `preview`. Cursor rules, skills, ITIL scripts, and ops docs updated for the train. No perpetual Supabase preview database — ephemeral branches only when testing schema/RLS/migrations.

### Fixed

- **Preview release-metadata sync** — Post-release PRs from `main` or `chore/release-v*` into `preview` use main-mode metadata validation so the version bump can land; day-to-day preview PRs still require real `[Unreleased]` list bullets (not headings/comments alone).

## [3.26.1] - 2026-07-16

### Fixed

- **Historical work order timeline editor** — Prepend missing `submitted` events when legacy records begin with `accepted`, restoring Accepted on event 2 and allowing saves (#1276). Production data backfill migration included.

## [3.26.0] - 2026-07-15

### Added

- **Equipment list** — Card/table view toggle, list pagination, and dedicated import and download menus on the toolbar.
- **Inventory & alternate groups** — Desktop table view with resizable sortable columns, list pagination, status dots on group cards, and an available-fields section in the column picker.
- **Fleet Export Console** — Inline collapsible column and worksheet pickers on export cards, plus Quick Form submission ledger export.

### Changed

- **Fleet Export Console** — Direct Export buttons replace quick/customize modals and the Export Protocol panel for standard exports.
- **Organization audit log** — Audit Explorer uses full-width layout and an improved dashboard grid for scanning export activity.
- **Inventory list** — Simplified toolbar; removed compact density toggle.

### Fixed

- **Async export jobs** — `enqueue_export_job` migration reads `pgmq_public.send` as `SETOF bigint` so equipment and work-order async exports enqueue reliably.

## [3.25.31] - 2026-07-14

### Fixed

- **Mobile work order timeline (#1258)** — Consolidate duplicate creation events on freshly assigned work orders, relabel the admin historical import control with clearer copy and touch targets, rename the mobile section to “Timeline & office details”, and badge historical import rows in the status timeline.

## [3.25.30] - 2026-07-14

### Changed

- **Daily Check-Ins (#1263)** — Unused templates are purged on delete; templates with ledger data are archived, hidden by default behind a "Show deleted check-ins" toggle, and restorable for ongoing QR use.

## [3.25.29] - 2026-07-14

### Fixed

- **Equipment create navigation (#1255)** — After creating equipment from the list modal, reset team scope to All teams and open the new equipment details page so the record is immediately discoverable.

## [3.25.28] - 2026-07-14

### Fixed

- **Historical timeline editor (#1250)** — Block accidental dialog dismiss during date/time entry: outside-click and portaled picker interactions no longer close the editor; invalid timelines cannot be dismissed; unsaved valid edits prompt an in-app discard confirmation.

## [3.25.27] - 2026-07-14

### Changed

- **@vitejs/plugin-react (#1112)** — Bump `@vitejs/plugin-react` from 6.0.2 to 6.0.3 (Dependabot).

## [3.25.26] - 2026-07-14

### Changed

- **@radix-ui/react-separator (#1109)** — Bump `@radix-ui/react-separator` from 1.1.10 to 1.1.11 (Dependabot).

## [3.25.25] - 2026-07-13

### Changed

- **@radix-ui/react-label (#1108)** — Bump `@radix-ui/react-label` from 2.1.10 to 2.1.11 (Dependabot).

## [3.25.24] - 2026-07-13

### Changed

- **@tanstack/react-query (#1106)** — Bump `@tanstack/react-query` from 5.101.0 to 5.101.2 (Dependabot).

## [3.25.23] - 2026-07-13

### Changed

- **@supabase/supabase-js (#1105)** — Bump `@supabase/supabase-js` from 2.106.2 to 2.110.2 (Dependabot).

## [3.25.22] - 2026-07-13

### Changed

- **tailwindcss (#1110)** — Bump `tailwindcss` from 4.3.0 to 4.3.2 (Dependabot).

## [3.25.21] - 2026-07-13

### Changed

- **@radix-ui/react-progress (#1115)** — Bump `@radix-ui/react-progress` from 1.1.10 to 1.1.12 (Dependabot).

## [3.25.20] - 2026-07-13

### Changed

- **@radix-ui/react-label** — patch bump from 2.1.10 to 2.1.11 (Dependabot #1108); transitive `@radix-ui/react-primitive` 2.1.7.
- **@radix-ui/react-switch (#1117)** — Bump `@radix-ui/react-switch` from 1.2.6 to 1.3.3 (Dependabot).

## [3.25.19] - 2026-07-12

### Changed

- **Export report query layer (#1192)** — Consolidate Fleet Export Console data access into `_shared/reports/` with explicit column whitelists, early org scoping for scans, and unified equipment/work-order fetch for sync and async export paths.

## [3.25.18] - 2026-07-12

### Changed

- **typescript-eslint (#1114)** — Bump `typescript-eslint` from 8.59.3 to 8.63.0 and align `@vitest/coverage-v8` (Dependabot).

## [3.25.17] - 2026-07-12

### Changed

- **@axe-core/playwright (#1102)** — Bump `@axe-core/playwright` from 4.11.3 to 4.12.1 (Dependabot).

## [3.25.16] - 2026-07-12

### Changed

- **Work orders ESLint cleanup (#1237)** — Removed dead hooks and service wrappers in `work-orders/services` and `work-orders/hooks` (−801 LOC); zero warnings in scoped paths.

## [3.25.15] - 2026-07-12

### Changed

- **actions/cache (#1103)** — Bump `actions/cache` from 5.0.5 to 6.1.0 across GitHub Actions workflows (Dependabot).

## [3.25.14] - 2026-07-12

### Changed

- **vitest-coverage-report-action (#1101)** — Bump `davelosert/vitest-coverage-report-action` from 2.12.0 to 2.12.1 (Dependabot).

## [3.25.13] - 2026-07-12

### Changed

- **actions/checkout (#1100)** — Bump `actions/checkout` from 6.0.3 to 7.0.0 across GitHub Actions workflows (Dependabot).

## [3.25.12] - 2026-07-12

### Changed

- **Unified work order PM template on create (#1162)** — Replaced the generic vs PM work order type split with a PM template dropdown directly below the title (None + clear control, equipment default). Collapsed equipment QR, card menu, details, and mobile quick-access entry points into one New Work Order flow.
- **Windows npm ci lock recovery** — Added `npm-ci-safe.bat` / `npm run ci:install` to stop dev tooling, delete stuck `node_modules` trees, and recover from EPERM/EBUSY on native binaries (`tailwindcss-oxide`, `lightningcss`) instead of leaving backup folders in the repo.

## [3.25.11] - 2026-07-12

### Changed

- **Supabase hot-path performance (#1203)** — Inventory list metadata now uses a single SQL aggregation RPC instead of scanning every SKU client-side; work-order team filters join equipment in one query; org background-sync channels use refcounted subscribe/unsubscribe cleanup and organization-scoped `equipment_notes` realtime filters.

## [3.25.10] - 2026-07-12

### Changed

- **markdownlint (#1232)** — Disable low-signal spacing/table rules (`MD060`, `MD022`, `MD032`, `MD031`); scope `lint:md` to `.cursor/**` and `AGENTS.md`; document enforced vs suppressed rules for agents.

## [3.25.9] - 2026-07-12

### Changed

- **vitest (#1116)** — Bump `vitest` from 4.1.8 to 4.1.10 and align `@vitest/coverage-v8` (Dependabot).

## [3.25.8] - 2026-07-12

### Changed

- **nanoid (#1104)** — Bump `nanoid` from 5.1.11 to 5.1.16 (Dependabot).

## [3.25.7] - 2026-07-11

### Fixed

- **Dark scrollbar theme (#1208)** — Global scrollbar styling uses subtle dark thumbs on transparent tracks so native light OS scrollbars no longer clash with the Mission Control palette in popovers, dialogs, sheets, and other overflow regions.

## [3.25.6] - 2026-07-11

### Changed

- **PM template assignment (#1209)** — "Apply to Equipment" now uses the same team-scoped multi-select dropdown as daily check-ins (search, select all/none/inverse, TopBar team scoping, "Current default" markers) on both the template cards and template detail view, replacing the old full-screen assignment dialog.

## [3.25.5] - 2026-07-11

### Changed

- **Help Center evidence quality gate (#1161)** — PR/docs capture now asserts frame quality at screenshot time (no horizontal overflow, controls fully in viewport via `evidence-frame-helpers.ts`) and requires a mandatory post-capture visual review (`visual-review-checklist.md` + `Complete-PrEvidenceVisualReview.ps1`) before upload/publish. `docs-demo-helpers.ts` shares the same frame assertions before spotlight choreography.

### Fixed

- **SEO crawl budget (#1220)** — Block authenticated app routes and sensitive paths in `robots.txt` so search engines concentrate crawl budget on public marketing pages instead of sign-in walls and soft 404s.

## [3.25.3] - 2026-07-11

### Fixed

- **Mobile inline image viewports (#1216)** — Disable touch panning on phones/tablets so page scroll is not blocked on note and equipment photos; always show download/copy controls on mobile; tap opens a pinch-zoom lightbox with export actions. Work order image carousels and galleries reuse the shared lightbox.

## [3.25.2] - 2026-07-11

### Changed

- **Testing infrastructure (#1214)** — Remove the `scripts/test-runner.mjs` log-watching wrapper; run Vitest natively with a forks pool. Add Vitest 4 `unit` (Node) and `component` (jsdom) projects for environment isolation. On Windows, `npm test` / `npm run test:component` shard the component suite into four sequential chunks with visible phase banners. Clear React Query caches in global teardown; document the testing-trophy strategy in `docs/technical/testing-guidelines.md`.

## [3.25.1] - 2026-07-11

### Changed

- **Equipment details desktop layout (#1212)** — Basic Information and Lifecycle & Warranty share a two-column row on desktop; Preventative Maintenance controls live on the Work Orders tab; Daily Operator Check-In assignment lives on the Check-Ins tab.

## [3.25.0] - 2026-07-09

### Added

- **Equipment media & artifacts library (#1129)** - Searchable/filterable media library with dedicated explorer, details-tab summary strip, create-time display image capture, and display-first chronological carousels (reusing DynamicImageViewport / NoteImageCarousel from #1185/#1200) on equipment and work order details.

## [3.24.0] - 2026-07-09

### Added

- **Async export jobs (#1193)** — Heavy equipment and work-order CSV exports enqueue via pgmq `exports`, process in `process-export-job`, store results in a private `export-results` bucket, and notify when ready. DB RPCs shape minimal columns to cut egress. Loading toasts cover Google Drive/Docs/Sheets and report exports until completion. Smaller report types remain synchronous.

### Fixed

- **Async export scope hardening (#1205)** — `enqueue_export_job` derives work-order `accessibleTeamIds` from DB memberships (non-admins cannot omit/forge org-wide scope); the worker re-checks admin vs scoped payload and rejects mismatched queue messages; client polling fails fast on `not_found` instead of timing out.

## [3.23.1] - 2026-07-09

### Changed

- **CI unit-test velocity (#1199)** — Slimmed the slowest equipment/inventory component tests to wiring smokes (filter/sort covered by existing/new hook and util unit tests; ~60% faster on profiled hotspots), enabled modest in-shard file parallelism (`maxWorkers: 2`) on Linux CI, and completed a happy-dom experiment (kept jsdom — full-suite regressions outweighed ~8–12% hotspot gains). Coverage ratchet remains on the merged PR report.

## [3.23.0] - 2026-07-08

### Added

- **Dynamic image viewports and notes card UI (#1185)** — Bespoke hover/touch panning viewports with download and copy-to-clipboard controls on equipment and work order images. Notes refactored into functional cards (carousel left, post-style content right) with role-based edit/delete/visibility controls, org-configurable author edit window, and audited note mutations via SECURITY DEFINER RPCs.

## [3.22.0] - 2026-07-08

### Changed

- **Edge function org-scoped helpers (#1194)** — Added `_shared/org-scoped-queries.ts` with reusable Zod request schemas, `parseJsonBody`, membership/admin guards, `withOrgScope` / `withOrgAdminScope`, and `applyOrganizationScope`. Refactored geocode-location, resolve-inventory-scan, export-report, get/set Google export destination, and manage-google-drive-destination-folder to use the shared patterns.

## [3.21.0] - 2026-07-08

### Added

- **Quick Forms (#1184)** — Standalone public data-collection forms, deliberately not tied to equipment or teams: time sheets, secure-area checks, assembly-line checklists, and other job-site capture. Org owners/admins build forms (short/long text, number, date, checkbox fields, optional GPS request) on the new **Operations → Quick Forms** page, share them via rotating non-enumerable QR tokens (`/qr/quick-form/{token}`), and read an append-only submission ledger with CSV/Excel/PDF exports.

## [3.20.0] - 2026-07-07

### Changed

- **Audit Log page refactor (#1166)** — The audit log is now a customizable dashboard: the Key Metrics, Timeline, and Events sections are drag/drop widgets on a grid, with the layout persisted per browser and a one-click "Reset layout" control.

## [3.19.0] - 2026-07-07

### Fixed

- **Microphone voice input (#1170)** — Voice dictation buttons no longer fail: the `Permissions-Policy` header now allows microphone use on EquipQR's own pages (`microphone=(self)` in Vite dev, Vercel, and Netlify configs), and clicking a mic button explicitly requests browser microphone consent before starting speech recognition.
- **Inventory item cost and threshold editing (#1165)** — Parts managers and org owners/admins can now change **Default Unit Cost** and **Low Stock Threshold** inline on the inventory item Overview tab using the same click-to-edit pattern as other fields.

## [3.18.0] - 2026-07-07

### Added

- **QuickBooks help-center guides** — Rewrote the Connect QuickBooks, Map Teams to QuickBooks Customers, and Export Work Orders to QuickBooks guides on equipqr.info around a complete PM-work-order-to-invoice walkthrough.

## [3.17.0] - 2026-07-07

### Fixed

- **Daily check-in QR link generation (#1179)** — Organization owners/admins can now generate a missing daily check-in QR link directly inside the QR code dialog.
- **preview.equipqr.app never updated (#1180)** — `preview-domain-alias.yml` now runs on push to `main` only: it fast-forwards the `preview` domain-anchor branch and fires the Vercel deploy hook.

## [3.16.1] - 2026-07-07

### Fixed

- **Team customer / QuickBooks linking (#1173)** — Customer account and QuickBooks invoice export now live on one card with explicit change, sync, and unlink controls.

## [3.14.0] - 2026-07-06

### Added

- **Dedicated team views (#1132)** — Team details gains a view switcher framing the same team data as an **Internal Team**, **Department**, or **Customer**.

## [3.13.0] - 2026-07-06

### Added

- **Cross-device daily check-in QR links (#1154)** — Raw operator check-in QR tokens are now generated server-side and persisted in an admin-only `operator_checkin_token_secrets` table.

## [3.12.12] - 2026-07-05

### Fixed

- **equipqr.info Help Center interactivity and branding (#1147)** — The docs site CSP was fixed to restore VitePress hydration and navigation.

## [3.12.11] - 2026-07-05

### Security

- **Customer roles oblivious to parts & internal costing** — Team Requestor/Viewer roles and plain members can no longer read work order cost line items at the database layer.

## [3.12.10] - 2026-07-05

### Changed

- **Daily Check-In mobile UX (#1128)** — Public operator check-in checklist rows support swipe right for Pass and swipe left for Fail.

## [3.12.9] - 2026-07-05

### Added

- **PM checklist Not Applicable (#1094)** — Technicians can mark PM checklist items as Not Applicable.

## [3.12.8] - 2026-07-05

### Fixed

- **Inventory list pagination (#1133)** — Inventory list fetches now use bounded Supabase range batches.

## [3.12.7] - 2026-07-05

### Fixed

- **Database cron helper errors (#1141)** — SECURITY DEFINER pg_cron helpers no longer cast `current_user` to `oid`.

## [3.12.6] - 2026-07-05

### Fixed

- **Daily Check-In template persistence (#1137)** — Assigned operator checklist templates no longer appear deleted after app updates.

## [3.12.5] - 2026-07-05

### Changed

- **Historical timeline editing (#1121)** — New timeline events copy the previous event timestamp and use simplified reason/note handling.

## [3.12.4] - 2026-07-05

### Changed

- **Historical timeline conversion density (#1099)** — Compact modal with numbered timeline steps and clearer add-event affordance.

## [3.12.3] - 2026-07-04

### Added

- **PM template management on active work orders (#1130)** — Technicians and managers can add, change, or remove a PM checklist on an open work order before completion or cancellation.

## [3.12.2] - 2026-07-04

### Added

- **Location maps documentation and evidence** — Expanded structured location editors and mobile equipment location map parity.

## [3.12.1] - 2026-07-04

### Fixed

- **Map location consistency (#1123)** — Equipment maps and location readouts now use a shared source model.

## [3.12.0] - 2026-07-03

### Added

- **Daily operator check-ins (#1091)** — Organization owners and administrators can define custom operator safety checklists and collect public QR submissions.

## [3.11.4] - 2026-07-04

### Fixed

- **Invitation signup onboarding (#1092)** — Users who sign up via organization invitation skip the getting-started wizard on their personal workspace.

## [3.11.3] - 2026-07-03

### Added

- **Scoped work order exports (#1096)** — Team requestors and viewers can export work orders they can view via customer-safe Service Report PDF.

## [3.11.2] - 2026-07-03

### Added

- **Work order follow-up notes (#1118)** — Team requestors and work-order creators can add public notes including after completion.

## [3.11.1] - 2026-07-03

### Added

- **Release metadata CI gate (#1119)** — Pull requests that touch release-relevant files must bump `package.json` above the base branch, keep `[Unreleased]` empty, and add a matching `CHANGELOG.md` version section.

## [3.11.0] - 2026-06-29

### Added

- **Historical work order conversion (#1093)** — Organization owners and administrators can convert an existing operational work order to a historical record.

## [3.10.0] - 2026-06-24

### Fixed

- **Equipment QR scan crash (#1074)** — Public equipment QR routes no longer throw outside `SimpleOrganizationProvider`.
- **Dashboard team filter (#1075)** — Key Metrics, chart widgets, recent lists, and KPI sparklines respect the TopBar team scope.
- **Team details not-found crash (#1076)** — Missing teams render the existing "Team not found" card instead of crashing.

## [3.9.4] - 2026-06-22

### Added

- **Google Cross-Account Protection (RISC)** — New `google-risc-receiver` edge function validates Google Security Event Tokens.

## [3.9.3] - 2026-06-20

### Changed

- **Dependency refresh** — Consolidated June 2026 npm and GitHub Actions updates.

## [3.9.2] - 2026-06-14

### Added

- **Dedicated organization Members page** — Member invites and Google Workspace import live at Organization → Members.

## [3.9.1] - 2026-06-13

### Fixed

- **Preview Google Workspace and QuickBooks connect** — Connect and reconnect on preview.equipqr.app now return to Organization Integrations after OAuth.

## [3.9.0] - 2026-06-14

### Added

- **Getting Started onboarding wizard** — Organization owners and administrators are guided through initial setup.

## [3.8.7] - 2026-06-13

### Fixed

- **Google Workspace OAuth reconnect after revoke** — Workspace connect now requests openid, email, and profile explicitly.

## [3.8.6] - 2026-06-10

### Fixed

- **equipqr.info Help Center loads** — Returning visitors with the old PWA service worker now receive a kill-switch worker.

## [3.8.5] - 2026-06-09

### Fixed

- **Help Center docs build** — Removed a broken internal link that blocked VitePress deployment.

## [3.8.4] - 2026-06-09

### Fixed

- **Equipment details mobile inline edit** — Edit buttons stay pinned to the card edge on narrow screens.

## [3.8.3] - 2026-06-08

### Added

- **PM interval policies** — Hierarchical preventive-maintenance schedules at equipment, team, and PM template levels.
- **Voice dictation in field workflows** — Microphone input on notes and text fields.
- **Equipment card grid and quick work orders** — Grid view cards show PM status and quick work-order actions.
- **Fleet Export Console** — Reports reorganized into categorized export modules.
- **Inventory list desktop personalization** — Saved views, column manager, density toggle, quick filters, stock-level bars, health summary, and bulk actions.

## [3.8.2] - 2026-06-07

### Added

- **Playwright user regression coverage** — Expanded critical/full browser suites and demo infrastructure.
- **Fallow codebase intelligence** — Static health, duplication, dead-code, and PR risk scripts/configuration.

## [3.8.1] - 2026-06-01

### Changed

- **Dependency maintenance** — Routine application/development dependency updates.

## [3.8.0] - 2026-06-01

### Added

- **Equipment Scan History timeline** — Equipment records now have a unified scan-history tab.
- **Organization Google Drive export destination** — Organization admins can choose one shared Google Drive folder for exports.

## [3.6.4] - 2026-05-24

### Changed

- **Internal ITIL workflow guidance** — Simplified agent-facing workflow guidance.

## [3.6.3] - 2026-05-24

### Fixed

- **Sign-up password breach check** — CSP now allows the HIBP k-anonymity range API.

## [3.6.2] - 2026-05-23

### Added

- **Marketing mobile demo videos** — PM Templates and QuickBooks feature pages now show mobile screen demos.

## [3.6.1] - 2026-05-21

### Fixed

- **SPA route hard reload** — Hard reloads and deep links to app routes no longer return Vercel 404.

## [3.6.0] - 2026-05-17

### Added

- **QuickBooks invoice payment visibility** — Work Orders retain mirrored QuickBooks invoice identifiers and lifecycle status.

## [3.5.3] - 2026-05-17

### Fixed

- **QuickBooks invoice export** — Summarized Parts line includes every non-labor work-order cost.

## [3.5.2] - 2026-05-16

### Changed

- **QuickBooks invoice export** — Draft invoices use summarized Labor and Parts lines.

## [3.5.1] - 2026-05-16

### Added

- **QuickBooks customer contact sync** — Imports and refreshes capture contact fields.
- **Public documentation site bootstrap** — VitePress docs site setup.

## [3.5.0] - 2026-05-15

### Added

- **QR PM template picker for untemplated equipment** — QR work-order creation surfaces a template chooser when needed.

## [3.4.0] - 2026-05-14

### Added

- **Preview Edge secret sync (CI)** — Preview Supabase Edge Function secrets drift checking and sync infrastructure.
- **QR scan feedback** — Live camera scans provide synthesized tone and vibration feedback.

## [3.3.2] - 2026-05-10

### Fixed

- **Equipment QR scan hero image** — QR equipment hero resolves signed URLs for private storage images.

## [3.3.1] - 2026-05-10

### Added

- **In-app QR scanner and PM summary on equipment QR landing** — Protected scanner route and PM summary.

## [3.3.0] - 2026-05-09

### Added

- **Schema-drift CI gate** — New workflow compares migrations with production schema migration state.

## [3.2.0] - 2026-05-02

### Added

- **Bulk inventory edit grid** — Desktop inline-edit grid for inventory management.
- **Support & Documentation library overhaul** — Scalable persona/workflow support library.
- **Guided alternate-group creation workflow** — Dedicated alternate-group create wizard.

## [3.1.1] - 2026-05-01

### Changed

- **Equipment creation permissions aligned** — Permissions aligned across React, validation, docs, and Supabase RLS.

## [3.1.0] - 2026-04-29

### Added

- **Permission-aware quick actions on equipment QR scan pages** — Lean QR quick-action island with permission checks.

## [3.0.1] - 2026-04-23

### Fixed

- **Public landing page rendered black screen when auth refresh failed** — Landing now renders unconditionally except confirmed authenticated redirect.

## [3.0.0] - 2026-04-23

### Added

- **Animated landing-page hero** — QR scan → US-state morph → PM checklist + export animation.
- **Real dashboard trends replace synthetic sparklines** — New dashboard trend RPC and widgets.
- **Quick-create team from the topbar team selector** — Compact quick-create affordance.
- **Bulk equipment edit grid** — Desktop power-user grid.
- **Qodo Merge per-repo configuration** — Repo-specific review rules and compliance configuration.
- **Global TopBar team filter** — Shared team filter now drives Equipment, Work Orders, and Fleet Map.
- **Command Center navigation** — Persistent context breadcrumb, grouped sidebar, and QuickBooks health pill.
- **High-density asset table view mode** — New compact equipment table view.
- **Accessibility wave-1 and wave-2** — Core tap target and focus-ring upgrades.

## [2.11.0] - 2026-04-19

### Added

- **Fleet Map runtime auth-failure diagnostic** — Real React error boundary and map auth diagnostics.
- **Edge Function observability + FleetMap Preview restoration** — Shared secret/correlation helpers and preview map restoration.
- **Production-faithful Fleet Map seed data** — Seed fixtures for location scenarios.
- **Vector Fleet Map with Advanced Markers** — Migrated to advanced markers/vector map support.
- **Maskable PWA icons** — Correctly-sized maskable app icons.

## [2.10.0] - 2026-04-18

### Added

- **Machine hours on work order and equipment notes** — Nullable machine-hours support on notes.
- **QuickBooks customer tax-exempt sync** — Tax posture sync from QBO.
- **Shared QuickBooks Edge Function config** — Centralized QBO configuration.
- **Playwright demo smoke infrastructure** — Demo recording harness.
- **Better Stack monitoring runbook** — Monitoring setup documentation.

## [2.9.0] - 2026-04-06

### Added

- **Customer account model behind Teams** — CRM-style customer accounts linked to Teams.
- **External customer contacts** — CRUD for non-user customer contacts.
- **Customer Account card on team detail** — Customer account display.
- **QuickBooks Import, Refresh, and Link flows** — Reworked mapping flows.
- **Customer account selector in team creation and editing** — Optional account selection.

## [2.8.0] - 2026-04-06

### Added

- **QR codes on work order PDF printouts** — Repeating Work Order and Equipment QR codes.
- **Work order QR scan entry route** — Public work-order QR route.

## [2.7.1] - 2026-04-05

### Changed

- **User Settings page redesign** — Settings page reorganized around section navigation.
- **Organization Settings page redesign** — Admin settings modernized.

## [2.7.0] - 2026-04-04

### Added

- **Export artifact lineage and replace-on-re-export** — Track last exported Google Doc per work order.
- **Team/equipment subfolder routing for Google Docs exports** — Human-readable routing into Drive folders.
- **Subfolder routing organization toggles** — Org-controlled folder organization settings.
- **Google Docs export toast with Open action** — Direct open action after export.
- **Drive file lifecycle helpers** — Safe deletion/metadata helpers.

## [2.6.0] - 2026-04-04

### Added

- **Better Stack uptime monitoring and status page** — Healthcheck function and monitoring RPC.
- **Worktree env bootstrap script** — Copy/link env files into worktrees.
- **Cursor stop hook for changelog hygiene** — Reminder when product code changes without changelog.
- **Google Docs internal packet export (v1)** — Editable Docs export for internal work-order packet.

## [2.5.2] - 2026-03-27

### Added

- **Landing mobile UX regression tests** — Mobile landing coverage.
- **Inventory item detail manual mobile QA** — QA checklist.

## [2.5.1] - 2026-03-22

### Fixed

- **App sidebar horizontal scrollbar** — Prevented accidental horizontal overflow.
- **Work order form equipment dropdown invisible behind dialog** — Fixed z-index layering.
- **Work order create PM stutter/freeze** — Guarded PM template auto-set effect.
- **Work order create working-hours warning never visible** — Fixed AlertDialog stacking.

## [2.5.0] - 2026-03-22

### Added

- **Fleet Map auto-fit viewport and Fit All** — Automatic bounds and refit control.
- **Dashboard mobile quick-actions FAB** — Mobile speed-dial for common dashboard actions.
- **Dashboard KPI sparklines** — Optional 7-point sparklines.

## [2.4.0] - 2026-03-16

### Added

- **SOC-2 session lifecycle controls** — Inactivity-based session timeout protection.
- **Security event notifications** — DB-backed security notifications.
- **Security trust page** — Public security page.
- **Global session revocation control in settings** — Sign out all sessions.
- **Seed equipment images pipeline** — Demo image seeding.
- **1Password Edge env sync** — Edge-function env syncing.
- **1Password app env sync** — Root app env syncing.
- **Equipment location history seed** — Location-history fixtures.
- **Landing page How It Works section** — Three-step QR workflow.

## [2.3.10] - 2026-03-15

### Added

- **PM interval tracking foundation** — PM interval schema/RPC support.
- **PM operational seed data** — Realistic PM/work-order seed history.
- **Equipment PM status UX components** — PM status display and hooks.

## [2.3.9] - 2026-03-13

### Added

- **Landing page Pricing, Roadmap, Footer** — New marketing sections.
- **Supabase local port preparation script** — Configurable local ports.

## [2.3.8] - 2026-03-12

### Changed

- Rolled up the current set of in-progress repository updates into the 2.3.8 release version.

## [2.3.7] - 2026-03-06

### Fixed

- Implemented the fix for Issue #575 in the shared image viewer so full-size images are no longer constrained by the old clipped container.
- Implemented Issue #576 work-order card enrichment including equipment metadata and offline compatibility.

## [2.3.6] - 2026-03-06

### Fixed

- **Dashboard hover effect causes scrollbars** — Removed hover scale while keeping shadow feedback.

## [2.3.5] - 2026-02-26

### Fixed

- **Dashboard stuck in edit mode on mobile** — Fixed initial mobile detection and removed react-grid-layout.

## [2.3.4] - 2026-02-10

### Fixed

- **Storage bucket creation missing from migrations** — Added idempotent storage bucket creation.
- **Duplicate storage policy migration** — Converted duplicate migration to no-op.
- **Non-idempotent storage migrations** — Added policy guards.

### Security

- **Storage RLS policies now enforce tenant scoping** — Hardened storage object policies.

## [2.3.3] - 2026-02-10

### Added

- **Image Upload Feature** — Replaced vulnerable external URL image inputs with Supabase Storage uploads.
- **Multi-Factor Authentication (MFA)** — TOTP-based MFA with role-based enforcement.
- **One-click dev environment scripts** — Windows app stack scripts.
- **Shared Google API retry utility** — Retry/backoff utility for Google APIs.
- **invalid_grant detection on token refresh** — Distinct token-revoked errors.

## [2.3.2] - 2026-02-10

### Added

- **Customizable dashboard grid system** — User-configurable widgets and layout persistence.
- **Widget catalog drawer** — Add/remove widgets from a catalog.
- **Per-user, per-organization layout persistence** — Independent layouts by org.
- **PM Compliance widget** — PM status donut chart.
- **Equipment by Status widget** — Fleet status donut chart.
- **Cost Trend widget** — Work-order cost trend chart.
- **Quick Actions widget** — Shortcut grid.

## [2.3.1] - 2026-02-09

### Added

- **Production Content Security Policy** — Added full CSP header.
- **Skip navigation link** — First-focusable skip link.
- **PageSEO on legal pages** — Per-page SEO metadata.
- **JSON-LD date signals** — Added publish/modified dates.
- **Query key factories for notes, images, and notifications** — Centralized query keys.
- **CSS content-visibility utilities** — Deferred off-screen rendering helpers.

## [2.3.0] - 2026-02-09

### Added

- **AGENTS.md** — Root agent guide.
- **Geolocation Hierarchy & Google Maps Integration** — Multi-tier equipment location system.

## [2.2.4] - 2026-02-08

### Added

- **In-App Bug Reporting with GitHub Integration** — Ticket reporting, diagnostics, and GitHub sync.

## [2.2.3] - 2026-02-01

### Added

- **Voice-to-Text for Technician Notes** — Browser speech-to-text for notes.
- **Clipboard Image Paste for Notes** — GitHub-style image paste.
- **Google Workspace Export Integration** — Google Sheets and Drive work-order exports.
- **README Prerequisites** — External service prerequisites.
- **LegalFooter Changelog Link** — Version links to changelog.
- **SUPPORT.md** — Support documentation.
- **Centralized Date Formats** — Shared display format constants.

## [2.2.2] - 2026-01-27

### Added

- **SEO Improvements** — Sitemap generation and route metadata.
- **HorizontalChipRow Component** — Shared horizontally scrollable chip row.

## [2.2.1] - 2026-01-26

### Added

- **Online Status Hook** — Track browser online/offline state.
- **QuickBooks Developer Skill** — QBO development guide.

## [2.2.0] - 2026-01-26

### Added

- **Web Push Notifications** — End-to-end web push support.
- **Team Stats and Activity** — Team overview statistics and recent activity.
- **Mobile Bottom Navigation** — Mobile nav bar.

## [2.1.3] - 2026-01-24

### Fixed

- **Google Workspace Member Management Navigation** — Fixed members navigation.

### Added

- **Import from Google Workspace Button** — Import directory members from Organization Members.

## [2.1.2] - 2026-01-24

### Added

- **Automatic Schema Export** — Workflow exports database schema on main pushes.

### Fixed

- **Google Workspace Organization Reuse** — Reuse any owned non-personal org.

## [2.1.1] - 2026-01-24

### Fixed

- **Google Workspace Members Not Appearing** — Pending directory users now appear in members list.

## [2.1.0] - 2026-01-14

### Added

- **Google Workspace Integration** — Directory import and workspace onboarding.
- **Migration Baseline** — Complete schema baseline migration.
- **Edge Function Shared Auth Utilities** — User/admin scoped clients and auth helpers.
- **Edge Function RLS Documentation** — Auth and RLS runbooks.

## [2.0.0] - 2026-01-13

### Added

- **Comprehensive Audit Trail System** — Organization-wide audit logging.
- **Organization Danger Zone** — Ownership transfer, leave, and delete flows.
- **Enhanced Report Export System** — Customizable columns and server export.
- **Work Order Excel Export** — Multi-worksheet work-order export.
- **Global Notifications** — System-wide broadcast notifications.
- **Disaster Recovery Documentation** — PITR and backup runbook.
- **Dashboard Stats Grid Component** — Reusable stats grid.
- **Equipment Insights Hook** — Reusable equipment insights data hook.

## [1.8.1] - 2026-01-12

### Fixed

- **Equipment Form Dropdown Overflow** — Replaced native datalist with viewport-aware autocomplete.

## [1.8.0] - 2026-01-12

### Added

- **Part Alternate Groups System** — Interchangeable/equivalent parts management.
- **Part Lookup Page** — Search alternate and compatible parts.
- **Organization-Level Parts Managers** — Org-wide parts management permissions.
- **Equipment Parts Tab** — Compatible inventory parts on equipment details.
- **Inventory User Guides** — Step-by-step inventory guides.

## [1.7.13] - 2026-01-11

### Added

- **User Journey Testing Framework** — Workflow-based tests with personas.
- **Persona-Based Test Fixtures** — Named persona and entity fixtures.
- **Persona-Aware Render Utilities** — Persona-aware render helpers.
- **PM Template Compatibility Rules Management** — Rules editor for PM templates.
- **PM Template Auto-Matching** — Template selection based on equipment compatibility.
- **Global PM Template Seeds** — Starter PM templates.

## [1.7.12] - 2026-01-10

### Added

- **Part Compatibility Rules** — Rule-based part compatibility matching.

## [1.7.11] - 2026-01-08

### Changed

- **PM Checklist Notes** — Notes auto-expand for negative assessment conditions.

## [1.7.10] - 2026-01-08

### Changed

- **Work Order Card (Mobile UX)** — Simplified mobile card layout and interactions.

## [1.7.9] - 2026-01-08

### Changed

- **Equipment List (Mobile UX)** — Compact list layout and mobile filter controls.

## [1.7.8] - 2026-01-07

### Changed

- **Work Order Card Consolidation** — Unified legacy desktop/mobile wrappers.

## [1.7.7] - 2026-01-07

*Changes for this version were not documented in this file.*

## [1.7.4] - 2026-01-02

### Removed

- **PrintExportDropdown Component** — Removed deprecated print/PDF generation UI.

## [1.7.3] - 2026-01-02

### Removed

- **Deprecated Multi-Equipment Support** — Removed multi-equipment support.
- **Debug Artifacts** — Removed development-only debug artifacts.
- **Automated Versioning Workflow** — Removed disabled versioning action.

## [1.7.2] - 2026-01-01

### Added

- **Work Order PDF Export Dialog** — Customer-facing PDF export options.
- **QuickBooks Integration** — Capture Intuit transaction ID headers.

## [1.7.1] - Previous Release

*Changelog entries prior to 1.7.2 were not tracked in this file.*

---

[Unreleased]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.32.0...HEAD
[3.32.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.31.0...v3.32.0
[3.31.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.30.0...v3.31.0
[3.30.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.29.1...v3.30.0
[3.29.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.29.0...v3.29.1
[3.29.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.28.0...v3.29.0
[3.28.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.27.0...v3.28.0
[3.27.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.26.1...v3.27.0
[3.26.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.26.0...v3.26.1
[3.26.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.25.31...v3.26.0
[3.18.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.17.0...v3.18.0
[3.11.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.11.2...v3.11.3
[3.11.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.11.1...v3.11.2
[3.11.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.11.0...v3.11.1
[3.11.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.10.0...v3.11.0
[3.10.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.9.3...v3.10.0
[3.9.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.9.2...v3.9.3
[3.9.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.9.1...v3.9.2
[3.9.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.9.0...v3.9.1
[3.9.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.7...v3.9.0
[3.8.7]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.6...v3.8.7
[3.8.6]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.5...v3.8.6
[3.8.5]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.4...v3.8.5
[3.8.4]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.3...v3.8.4
[3.8.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.2...v3.8.3
[3.8.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.1...v3.8.2
[3.8.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.8.0...v3.8.1
[3.8.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.6.4...v3.8.0
[3.6.4]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.6.3...v3.6.4
[3.6.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.6.2...v3.6.3
[3.6.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v3.6.1...v3.6.2
[2.8.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.5.2...v2.6.0
[2.5.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.5.1...v2.5.2
[2.5.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.10...v2.4.0
[2.3.10]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.9...v2.3.10
[2.3.9]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.8...v2.3.9
[2.3.8]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.7...v2.3.8
[2.3.7]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.6...v2.3.7
[2.3.6]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.5...v2.3.6
[2.3.5]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.4...v2.3.5
[2.3.4]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.3...v2.3.4
[2.3.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.2.4...v2.3.0
[2.2.4]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.2.3...v2.2.4
[2.2.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.1.3...v2.2.0
[2.1.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.8.1...v2.0.0
[1.8.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.13...v1.8.0
[1.7.13]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.12...v1.7.13
[1.7.12]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.11...v1.7.12
[1.7.11]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.10...v1.7.11
[1.7.10]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.9...v1.7.10
[1.7.9]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.8...v1.7.9
[1.7.8]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.7...v1.7.8
[1.7.7]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.4...v1.7.7
[1.7.4]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Columbia-Cloudworks-LLC/EquipQR/releases/tag/v1.7.1
