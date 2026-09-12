# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to EquipQR by ZNT LLC will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries through 3.28.0 are more verbose than the current policy. Newer notes are short customer-facing outcomes. Editorial rules live in `.cursor/rules/changelog.mdc`.

## [Unreleased]

- **Inventory list localization** — Inventory browsing now supports Vietnamese, English, and Korean across list controls, filters, saved views, stock indicators, actions, and empty states. (#5)

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

- **typescript-eslint (#1114)** — Bump `typescript-eslint` from 8.59.3 to 8.63.0 (Dependabot).

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

- **PM Templates assignment UX (#1209)** — Template card assignment triggers use outline styling so titles scan more easily, and the label shows **Assigned Equipment (count)** when equipment in the current team scope already uses the template as its default PM.

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

- **Dynamic image viewports and notes card UI (#1185)** — Bespoke hover/touch panning viewports with download and copy-to-clipboard controls on equipment and work order images. Notes refactored into functional cards (carousel left, post-style content right) with role-based edit/delete/visibility controls, org-configurable author edit window, public/private filters, and audited note mutations via SECURITY DEFINER RPCs. Removed duplicate equipment images gallery from the Notes tab.

## [3.22.0] - 2026-07-08

### Changed

- **Edge function org-scoped helpers (#1194)** — Added `_shared/org-scoped-queries.ts` with reusable Zod request schemas, `parseJsonBody`, membership/admin guards, `withOrgScope` / `withOrgAdminScope`, and `applyOrganizationScope`. Refactored geocode-location, resolve-inventory-scan, export-report, get/set Google export destination, and manage-google-drive-destination-folder to use the shared patterns.

## [3.21.0] - 2026-07-08

### Added

- **Quick Forms (#1184)** — Standalone public data-collection forms, deliberately not tied to equipment or teams: time sheets, secure-area checks, assembly-line checklists, and other job-site capture. Org owners/admins build forms (short/long text, number, date, checkbox fields, optional GPS request) on the new **Operations → Quick Forms** page, share them via rotating non-enumerable QR tokens (`/qr/quick-form/{token}`), and read an append-only submission ledger with CSV/Excel/PDF exports. Unauthenticated submitters go through a new `quick-form` edge function (token auth, hCaptcha when configured, per-form rate limiting). All form definitions, raw QR tokens, and submissions are owner/admin-only via RLS — plain members have no access because collected data may be sensitive.
- **Production edge deploy** — **Production Release Readiness** runs `supabase functions deploy` after migrations, schema drift, and Vercel promote on every `main` push, so new Edge Functions (including `quick-form`) reach production automatically without a manual CLI step.

## [3.20.0] - 2026-07-07

### Changed

- **Audit Log page refactor (#1166)** — The audit log is now a customizable dashboard: the Key Metrics, Timeline, and Events sections are drag/drop widgets on a grid (drag by the header grip, resize from the edges, collapse sections you don't need), with the layout persisted per browser and a one-click "Reset layout" control. The events table shows in full width until entries are selected. Selecting a single entry opens the detail inspector with new "Copy Markdown" / "Copy JSON" clipboard actions; selecting multiple entries (row checkboxes, Ctrl/Cmd-click, or Shift-click ranges) swaps the detail pane for a bulk-actions pane that exports the selected entries as Markdown, Excel, or PDF. The list/detail resize handle got a clearer grab affordance with hover highlighting and a tighter hit area.

## [3.19.0] - 2026-07-07

### Fixed

- **Microphone voice input (#1170)** — Voice dictation buttons no longer fail: the `Permissions-Policy` header now allows microphone use on EquipQR's own pages (`microphone=(self)` in Vite dev, Vercel, and Netlify configs), and clicking a mic button explicitly requests browser microphone consent before starting speech recognition. If the user denies access, clicking the button again restarts the consent process with an actionable error message. Privacy policy copy updated to describe the browser-only dictation flow (audio is never recorded or stored by EquipQR).
- **Inventory item cost and threshold editing (#1165)** — Parts managers and org owners/admins can now change **Default Unit Cost** and **Low Stock Threshold** inline on the inventory item Overview tab using the same click-to-edit pattern as other fields (with numeric validation; clearing the cost removes it). Changes are recorded in the audit log by the existing inventory audit trigger.

### Changed

- **Voice input placement (#1170)** — All voice dictation buttons now use one consistent icon style anchored to the bottom-left corner of the text box they control (notes composers, equipment form description, work order description, PM general notes, working-hours notes, and QR quick-action dialogs).
- **PM template selector moved to Work Orders tab (#1169)** — The equipment PM template control moved from the Details tab to a prominent dropdown at the top of the Work Orders tab. The dropdown stays locked until the inline edit control is clicked, preventing accidental template changes; picking an option saves immediately and re-locks the control.

## [3.18.0] - 2026-07-07

### Added

- **QuickBooks help-center guides** — Rewrote the Connect QuickBooks, Map Teams to QuickBooks Customers, and Export Work Orders to QuickBooks guides on equipqr.info around a complete PM-work-order-to-invoice walkthrough, with real screenshots and demo videos hosted in the public `docs-media` bucket.
- **Unattended QuickBooks browser session tooling** — New agent scripts (`scripts/qbo/Connect-QboBrowserSession.ps1` + `scripts/qbo/qbo-browser-signin.mjs`) open a signed-in QuickBooks browser session for automation. Partial for now: Intuit's passkey chooser still blocks fully unattended sign-in.

### Changed

- **QuickBooks invoice Parts line** — Exported invoices now itemize the Parts line description from the work order's cost rows instead of a bare "Parts" label.
- **QuickBooks invoice billing email** — Invoice export (create and update) now seeds the invoice `BillEmail` from the QuickBooks customer's primary email — never overwriting an email already on the invoice — so "Review and send" in QuickBooks no longer requires manual email entry.

### Fixed

- **Work order Export menu flicker** — The QuickBooks entry in the Export menu stays visible (disabled) while the permission check loads instead of being omitted on first open; the submenu also migrated to the shared QuickBooks query-key factories.
- **Mobile QuickBooks invoice status** — Mobile work order details now shows the QuickBooks invoice status badge (draft/sent/paid with balance and invoice number) in the summary card, matching desktop.
- **Fleet Map API-key diagnostics** — The Fleet Map error boundary now recognizes Google Maps API-key authorization crashes (opaque `marker.js`/`main.js` TypeErrors) and renders the actionable HTTP-referrer-allowlist diagnostic card instead of the generic error card.

## [3.17.0] - 2026-07-07

### Fixed

- **Daily check-in QR link generation (#1179)** — Organization owners/admins can now generate a missing daily check-in QR link directly inside the QR code dialog (equipment list and equipment details, desktop and mobile). Previously the dialog only pointed at the equipment-details actions menu, leaving assignments minted before server-side token persistence (#1154) with no reachable "generate" action — the "QR link is not available" notice persisted no matter what the user tried.
- **preview.equipqr.app never updated (#1180)** — `preview-domain-alias.yml` now runs on push to `main` only: it fast-forwards the `preview` domain-anchor branch and fires the Vercel deploy hook (plain git pushes of a commit already built for `main` are deduplicated by Vercel and produce no deployment). The branch-bound domain auto-aliases to the new deployment, so the old `deployment_status`-triggered alias job and `scripts/vercel/Set-PreviewDomainAlias.ps1` were removed — the workflow no longer attaches skipped checks to every PR. The branch previously did not exist on the remote (stale since v3.9.2).

### Added

- **Schema reference dump guardrail (#1182)** — New `supabase/current_schema.sql` reference dump derived from the migration chain, documented in `docs/ops/migrations.md` (regeneration rule, commands, AI-generated migration guidance, data-only skip marker). A git-based CI check (`scripts/check-schema-reference.mjs`, wired into the Supabase Migration Validator workflow and `npm run verify:schema-reference`) fails PRs that change schema-affecting migrations without regenerating the dump; PRs without migration changes pass trivially and no database is required in CI.

## [3.16.1] - 2026-07-07

### Fixed

- **Team customer / QuickBooks linking (#1173)** — Customer account and QuickBooks invoice export now live on one card with explicit change, sync, and unlink controls; export gating resolves through the customer account chain (not legacy mapping only); changing a linked QuickBooks customer remaps in place instead of importing duplicates; refresh looks up customers by QuickBooks ID; team managers and requestors appear as automatic contacts; manual external contacts are manageable by team managers.
- **QuickBooks token refresh UX (#1177)** — Removed the TopBar QuickBooks status badge and the misleading manual “Refresh Now” control on Integrations; reconnect is shown only when authorization truly expires.
- **Team details map console hygiene (#1174)** — Team location preview skips the Google Map when no Map ID is configured, avoiding deprecated marker initialization paths.

### Fixed

- **Stale private image URLs (#1171)** — Expired Supabase signed URLs and orphaned storage references no longer pass through as `<img src>` fallbacks; missing objects resolve to null so the UI shows icon placeholders instead of flooding the console with 400s.
- **Equipment list lazy-load intervention (#1175)** — Above-the-fold equipment cards use `loading="eager"` (same pattern as work orders) to silence Edge/Chrome lazy-load intervention warnings on `/dashboard/equipment`.
- **Team details map deprecation (#1174)** — `TeamLocationCard` migrates from deprecated `google.maps.Marker` to `@vis.gl/react-google-maps` `AdvancedMarker` with vector map support.

### Changed

- **Local dev media seed (#1176)** — Replaced `scripts/seed-equipment-images.ps1` with `scripts/seed-dev-media.ps1`: uploads canonical paths to private buckets, supports `equipment/`, `drop/`, and `work-orders/` folders (JPEG/PNG/WebP/GIF), and wires equipment display images plus equipment-note and work-order note images after `dev-start.bat -Force`.
- **Dependency cleanup (#1174)** — Removed unused `@react-google-maps/api` after team and fleet maps fully migrated to `@vis.gl/react-google-maps`.

### Added

- **Generated volume seed pipeline (#1164)** — Replaces the committed `26_large_inventory.sql` bulk file with `scripts/seed-data/generate-seeds.ts`, emitting deterministic inventory, equipment, work orders (with consumed parts and costs), parts RBAC grants, and operator check-ins into gitignored `supabase/seeds/generated/`. Wired into `dev-start.bat -Force` (`-SeedScale`) and `dev-test.bat reset-db`; guardrail tests in `src/tests/scripts/generateSeeds.test.ts`.
- **Help Center docs media (#1161)** — Standardized Playwright demo choreography (`docs-demo-helpers.ts`: settle, scroll-into-view, dim/blur spotlight) for desktop and mobile. New PR evidence specs capture **Start Here** and **Technician Field Work** collections; screenshots and MP4 demos published to the public `docs-media` bucket and embedded in equipqr.info articles.

### Changed

- **Equipment critical E2E** — List assertions use search/detail routes instead of assuming seeded assets appear on page 1 after generated volume data.
- **Privacy/signup full E2E** — Auto-solve hCaptcha when the local test sitekey is configured.

## [3.14.0] - 2026-07-06

### Added

- **Dedicated team views (#1132)** — Team details gains a view switcher framing the same team data as an **Internal Team** (members and collaboration first), a **Department** (fleet metrics and maintenance posture first), or a **Customer** (external account, contacts, and service history first). Team managers can persist the active view as the team-wide default (`teams.preferred_view`); the Customer view prompts to link a customer account when none is attached.
- **Mobile quick access drawers (#1151)** — Equipment details gets a QR-first quick access button: the equipment scan QR, one shortcut per enabled daily check-in QR, PM/generic work order creation, and note capture in one bottom drawer. Work order details consolidates the next status transition, add note/photo, the work order QR code (previously list-only), and all exports (PDF, files, Google Drive, QuickBooks) behind a Quick actions entry in the field footer, with a floating button when the footer is hidden.
- **Parts Access panel (#1152)** — The Inventory page button now manages both inventory grants in one sheet: Parts Managers (create/edit/delete) and Parts Consumers (view + part lookup), using a shared searchable multi-select with select all/none/inverse. The mobile footer opens the same sheet instead of deep-linking to Members.

### Changed

- **Audit log buried and hardened (#1122)** — The audit log moved from main navigation to **Organization → Audit Log** (old path redirects), is now owner/admin-only at every layer (page guard, `audit_log` SELECT RLS, `get_audit_log_timeline` RPC), and embedded audit history was removed from work order and inventory detail pages in favor of admin-only deep links into the pre-filtered explorer. Audit entries remain excluded from all non-audit export paths.
- **PM template assignment (#1144)** — "Apply to Equipment" now uses the same team-scoped multi-select dropdown as daily check-ins (search, select all/none/inverse, TopBar team scoping, "Current default" markers) on both the template cards and template detail view, replacing the old full-screen assignment dialog. Built-in templates are explicitly branded **EquipQR Templates** with assign-directly-without-cloning messaging.

### Fixed

- **equipqr.info dead links (#1158)** — The sha256-hash CSP from #1147 drifted whenever any docs page changed (VitePress regenerates its inline hash-map bootstrap while Vercel serves headers from the committed `vercel.json`), silently re-breaking hydration so left-clicks did nothing. The docs build now externalizes all VitePress inline scripts to content-addressed `/assets/inline.*.js` files and ships a static `script-src 'self'` CSP that cannot drift; the build fails if any inline script or hash-based CSP reappears.

## [3.13.0] - 2026-07-06

### Added

- **Cross-device daily check-in QR links (#1154)** — Raw operator check-in QR tokens are now generated server-side and persisted in an admin-only `operator_checkin_token_secrets` table (RLS: organization owners/admins), so a QR link created on one device can be viewed and printed from any other device or browser. The previous in-memory browser cache is removed; assignments created before this release show a notice directing admins to rotate the QR link once.

### Fixed

- **Equipment Check-Ins tab crash (#1155)** — Opening the Check-Ins tab (and other Radix-composed surfaces) could crash with "Maximum update depth exceeded" under React 19 due to unstable composed-ref identities in Radix primitives. Upgraded `@radix-ui/react-select`, `react-popover`, `react-scroll-area`, `react-dropdown-menu`, `react-toast`, `react-tooltip`, `react-slot`, `react-tabs`, `react-dialog`, and `react-alert-dialog` to the patched releases; the dialog 1.1.15 pin (jsdom focus recursion workaround) is removed because the upstream fix landed in the same patch line.
- **Fleet Map console CSP errors (#1088)** — Production CSP now includes `'wasm-unsafe-eval'` (WASM-only compilation, not JS eval) in `script-src`, letting Google Maps' WebGL vector basemap compile its label worker without flooding the console with CompileError violations.
- **Work order list image 404s (#1086)** — Equipment thumbnails on work order cards now resolve signed URLs instead of emitting canonical storage paths into `<img src>` (which the browser resolved against `/dashboard/...` and 404'd). The thumbnail component also refuses to render non-URL paths as a guard.
- **Equipment list image 400s (#1156)** — Equipment display image signing derives the owning bucket from the known equipment id instead of probing the work-order bucket with individual sign calls, eliminating guaranteed 400 responses in the console; remaining lookups batch through `createSignedUrls`.
- **Invite Member modal and silent toasts (#1081)** — The app never mounted a Sonner `<Toaster />`, so every `sonner` toast (including "Invitation sent successfully") was invisible; one is now mounted above modal overlays. The Invite Member dialog also closes on failed sends so the outcome toast is visible instead of hidden behind the modal.
- **CI test stderr noise (#1148)** — Work order service and organization provider tests mock the app logger for expected error paths, the equipment form test uses a constructable service mock (Vitest 3 `new` support), and the resizable panel test mock no longer spreads library-only props onto DOM nodes.

## [3.12.12] - 2026-07-05

### Fixed

- **equipqr.info Help Center interactivity and branding (#1147)** — The docs site CSP (`script-src 'self'`) blocked the inline scripts VitePress needs to hydrate, leaving the front page with dead feature cards, a dead hero button, and a non-functional theme toggle. Post-build CSP hash generation (`scripts/docs/generate-docs-csp.mjs`) now allowlists the three VitePress inline bootstraps without `script-src 'unsafe-inline'`. The Help Center also gains EquipQR branding: navbar logo, homepage hero logo, and favicon (previously 404). Playwright evidence serves the built docs through the exact production CSP to guard hydration, navigation, and theming.

## [3.12.11] - 2026-07-05

### Security

- **Customer roles oblivious to parts & internal costing** — Team Requestor/Viewer roles and plain members can no longer read work order cost line items (parts, unit pricing, labor) at the database layer: `work_order_costs` RLS now requires org owner/admin, the work order assignee, or an operational team role (owner/manager/technician) on the work order's team, and the previous cross-tenant `created_by`-only INSERT/UPDATE/DELETE surface is closed. UI leaks fixed: cost subtotals on mobile work order cards, labor hours on public work order notes, estimated hours in the requestor status card, the Cost Trend dashboard widget/catalog entry, the equipment Parts tab, the dashboard "New Inventory Item" shortcut, and the work order "Add from Inventory" picker are all hidden from users without cost or inventory access.

### Fixed

- **Parts Consumer work order consumption** — Parts Consumers can now consume and restore parts through work orders they hold operational access to: `adjust_inventory_quantity` accepts work-order-scoped adjustments for consumers (validating the work order belongs to the item's organization) instead of requiring the Parts Manager grant, and cost delete/update inventory restore flows pass the work order id.

## [3.12.10] - 2026-07-05

### Changed

- **Daily Check-In mobile UX (#1128)** — Public operator check-in checklist rows support swipe right for Pass and swipe left for Fail, show answered Pass/Fail color states, keep accessible Pass/Fail buttons, and add a Reset form shortcut without re-scanning the QR code.

## [3.12.9] - 2026-07-05

### Added

- **PM checklist Not Applicable (#1094)** — Technicians can mark PM checklist items as Not Applicable instead of forcing OK plus notes. N/A counts toward checklist completion and renders with distinct grey styling in item rows and progress segments.

## [3.12.8] - 2026-07-05

### Fixed

- **Inventory list pagination (#1133)** — Inventory list fetches now use bounded Supabase range batches (500 rows per request) instead of loading all organization parts in one query, preserving existing list filters, sorting, exports, and quick filters.

## [3.12.7] - 2026-07-05

### Fixed

- **Database cron helper errors (#1141)** — SECURITY DEFINER pg_cron helpers no longer cast `current_user` to `oid`, eliminating recurring `invalid input syntax for type oid: "postgres"` errors during queue-worker, Stripe MV refresh, and QuickBooks token refresh jobs. QuickBooks manual refresh calls a dedicated internal helper so pg_cron-only guards do not block authenticated operators; RPC messaging clarifies org-scoped expiring counts vs global refresh job. Production `postgres` collation was refreshed after the dependent-object query returned no rows; the remaining `template1` collation warning is vendor-owned and tracked in #1143 after Supabase rejected agent-side refresh with `must be owner of database template1`.

## [3.12.6] - 2026-07-05

### Fixed

- **Daily Check-In template persistence (#1137)** — Assigned operator checklist templates no longer appear deleted after app updates when equipment assignments remain enabled; inconsistent inactive-template states are repaired and blocked at the database layer while explicit admin delete still archives templates and disables QR links.

## [3.12.5] - 2026-07-05

### Changed

- **Historical timeline editing (#1121)** — New timeline events copy the previous event timestamp, date/time pickers open on the selected month with shortcuts, and per-event reason fields are removed in favor of work order notes.
- **Historical note timestamps (#1121)** — Owner/admins can adjust note timestamps on historical work orders only; edits are audit-logged without mutating prior audit entries.

## [3.12.4] - 2026-07-05

### Changed

- **Historical timeline conversion density (#1099)** — Compact modal with numbered timeline steps, clearer add-event affordance, terminal-status guidance, and desktop two-column layout for notes alongside timeline and change history.

## [3.12.3] - 2026-07-04

### Added

- **PM template management on active work orders (#1130)** — Technicians and managers can add, change, or remove a PM checklist on an open work order before completion or cancellation. PM checklist data resets on template change; work order photos, notes, and costs are preserved. Help Center guide and PR evidence cover the full workflow.

### Fixed

- **Work order delete resilience (#1130)** — Owner/admin cascade delete no longer fails when storage object cleanup hits path mismatches; PM row deletion is allowed via scoped RLS for active work orders.

## [3.12.2] - 2026-07-04

### Added

- **Location maps documentation and evidence** — Replaces PR #1131 with expanded scope: shared structured location editors for inventory, teams, and organization defaults; mobile equipment location map parity; production Supabase `docs-media` bucket for public docs screenshots/videos; equipqr.info guides for location sources/maps and inventory storage locations with persistent media URLs; desktop and mobile PR evidence specs.

### Changed

- **Map location consistency (#1123)** — Equipment maps and location readouts use a shared source model with explicit selectors across Fleet Map, equipment details, work orders, and inventory; inline address editing and live-location capture on equipment and structured location dialogs.

## [3.12.1] - 2026-07-04

### Fixed

- **Map location consistency (#1123)** — Equipment maps and location readouts now use a shared source model (team location, equipment location, last known scan location, legacy coordinates) with explicit labels and selectors across Fleet Map, equipment details, work orders, and scan/location history. Equipment detail maps render via the vis.gl loader, expose a source dropdown on the location card, and let editors set an equipment address directly from the map card (which switches the asset off team inheritance). Scan GPS inserts now sync `last_known_location` so mini maps stay aligned with fleet scan fallback.

## [3.12.0] - 2026-07-03

### Added

- **Daily operator check-ins (#1091)** — Organization owners and administrators can define custom operator safety checklists, assign a separate public QR code per machine, and collect append-only unauthenticated operator submissions with optional GPS and required mileage when configured. Admins can review the daily ledger, export CSV evidence, and download a print/PDF-friendly daily report.

## [3.11.4] - 2026-07-04

### Fixed

- **Invitation signup onboarding (#1092)** — Users who sign up via organization invitation skip the getting-started wizard on their personal workspace and land on the invited organization dashboard after accepting the invitation.

## [3.11.3] - 2026-07-03

### Added

- **Scoped work order exports (#1096)** — Team requestors and viewers can export work orders they can view via customer-safe Service Report PDF and a scoped Work Order Exports console on Reports; private notes and costs remain excluded; org owners and administrators retain the full Fleet Export Console.

## [3.11.2] - 2026-07-03

### Added

- **Work order follow-up notes (#1118)** — Team requestors and work-order creators can add public notes (including after completion) for evidence such as purchase order numbers; managers and technicians retain full note functionality on completed work orders; cancelled work orders stay note-locked.

## [3.11.1] - 2026-07-03

### Added

- **Release metadata CI gate (#1119)** — Pull requests that touch release-relevant files must bump `package.json` above the base branch, keep `[Unreleased]` empty, and add a matching `CHANGELOG.md` version section.

## [3.11.0] - 2026-06-29

### Added

- **Historical work order conversion (#1093)** — Organization owners and administrators can convert an existing operational work order to a historical record, backdate its operational timeline, and re-export customer documentation with corrected created and completed dates.

## [3.10.0] - 2026-06-24

### Fixed

- **Equipment QR scan crash (#1074)** — Public `/qr/equipment/:equipmentId` routes no longer throw outside `SimpleOrganizationProvider`; unauthenticated users are redirected to sign-in with `pendingRedirect` preserved.
- **Dashboard team filter (#1075)** — Key Metrics, chart widgets, recent lists, and KPI sparklines respect the TopBar team scope (All / Unassigned / specific team) via client query filters and an updated `get_dashboard_trends` RPC.
- **Team details not-found crash (#1076)** — Missing teams render the existing "Team not found" card instead of crashing on an undefined `ArrowLeft` icon.

## [3.9.4] - 2026-06-22

### Added

- **Google Cross-Account Protection (RISC)** — New `google-risc-receiver` edge function validates Google Security Event Tokens and disconnects affected Google Workspace credentials on token/session revocation events.

### Changed

- **Incremental Google Workspace OAuth consent** — Initial Connect and onboarding request directory scopes only; export scopes (Drive, Docs, Sheets) are requested in context via Finish authorization or Grant Drive permissions.
- **Google Auth Platform branding** — Privacy Policy, Terms of Service, and developer contact verified in GCP console for OAuth app verification.

### Fixed

- **Google OAuth compliance (#1065)** — Addresses Project Checkup alerts for incremental authorization and Cross-Account Protection; legacy browser settings remain a console-side client configuration item pending Google re-scan.

## [3.9.3] - 2026-06-20

### Changed

- **Dependency refresh** — Consolidated June 2026 npm and GitHub Actions updates (React 19.2.7, Radix UI patches, TanStack Query 5.101, React Router 7.17, and CI workflow action pins) superseding Dependabot PRs #1046–#1064. Vitest held at **4.1.8** (Dependabot #1051 skipped) due to worker IPC stack overflow in 4.1.9 under forked CI shards. `@radix-ui/react-dialog` and `@radix-ui/react-alert-dialog` pinned to **1.1.15** (override) because 1.1.17 regresses jsdom focus under Radix Select/AlertDialog in unit tests.

## [3.9.2] - 2026-06-14

### Added

- **Dedicated organization Members page** — Member invites and Google Workspace import live at Organization → Members with a mobile-first action bar so Import and Invite stay on screen on phones.

### Changed

- **Organization admin layout** — Members, Settings, and Integrations are separate pages with a shared sub-navigation instead of tabs on a single settings screen.
- **Production release automation** — Production Release Readiness now runs `vercel promote` after migrations and schema drift pass, so equipqr.app updates without a manual Vercel dashboard promote.
- **Git and deploy workflow** — Development branches off `main` only; git branch **`preview`** kept as a Vercel domain anchor for optional **`preview.equipqr.app`**; default QA is each push’s **`*.vercel.app`** Preview URL.

### Fixed

- **Mobile organization settings** — Privacy toggles and save actions stack cleanly on narrow viewports instead of crowding controls off-screen.

## [3.9.1] - 2026-06-13

### Fixed

- **Preview Google Workspace and QuickBooks connect** — Connect and reconnect on preview.equipqr.app now return to Organization Integrations after OAuth instead of failing when the callback lands with query parameters.

### Changed

- **Preview environment** — Preview at preview.equipqr.app now shares the production data backend used by equipqr.app, so pull-request previews validate against real integration callbacks without maintaining a separate preview database.

## [3.9.0] - 2026-06-14

### Added

- **Getting Started onboarding wizard** — Organization owners and administrators who have not completed product onboarding are guided through creating their first team, adding equipment, and affixing a QR code before accessing the full dashboard.
- **Work order export menu** — Unified export dropdown on work order details with QuickBooks invoice export, Google Drive submenus (PDF, Docs, Sheets), and direct CSV/DOCX downloads on desktop and mobile.
- **Google Drive export folder management** — Organization administrators can create and delete the shared Google Drive export destination folder from Organization Integrations.
- **Mobile work order actions** — Inline assignee editing, a dedicated status sheet, and a mobile export section on work order details for field workflows.
- **Accessibility (WCAG 2.1 AA)** — Keyboard navigation helpers, screen-reader chart summaries, jsx-a11y structural fixes, and axe regression coverage across critical dashboard flows.

### Changed

- **Google Workspace disconnect** — Organization Integrations replaces the healthy-state Reconnect action with Disconnect (confirmation dialog) and contextual Grant permissions when scopes are incomplete; disconnect always clears OAuth credentials, the cached directory, and the workspace domain claim so onboarding can restart from scratch.
- **Work order assignment and status on mobile** — Improved inline assignment editing and status management on work order detail pages.

### Fixed

- **Product onboarding eligibility** — Established organizations that already have a team and equipment no longer get redirected to the Getting Started wizard.
- **Google Workspace OAuth scope storage** — Re-authorization merges incremental consent grants with stored scopes instead of overwriting them with a partial grant list.
- **Google Workspace connection health** — Permissions-needed state evaluates feature scopes only, so missing openid/email/profile no longer shows a false Permissions needed badge after a successful connect.
- **Google Workspace disconnect permissions** — Disconnect and manage-access actions are limited to organization owners and administrators.
- **QuickBooks customer search authentication** — Customer search surfaces clearer reconnect guidance when QuickBooks returns 401 or 403 authentication errors.
- **Work order PDF Save to Google Drive** — PDF exports save reliably to the organization Google Drive destination folder.

## [3.8.7] - 2026-06-13

### Fixed

- **Google Workspace OAuth reconnect after revoke** — Workspace connect now requests openid, email, and profile explicitly so the OAuth callback can load Google userinfo after a clean revoke at Google Account permissions (previously those scopes were inherited only via include_granted_scopes).
- **Google Workspace OAuth return handling on Integrations** — Connect and reconnect flows return to Organization Integrations with success and error toasts instead of silently failing when the callback redirects with query parameters.

### Added

- **Google Workspace access contract** — Claimed Workspace domains no longer auto-join on Google sign-in; administrators must import directory users or send standard invitations. Directory sync reconciles suspended/removed users and revokes only Workspace-derived access, and disconnect clears OAuth credentials and the directory cache while keeping the domain claimed.

## [3.8.6] - 2026-06-10

### Fixed

- **equipqr.info Help Center loads** — Returning visitors who still had the old EquipQR PWA service worker registered now receive a kill-switch worker that clears stranded caches and unregisters so equipqr.info serves the VitePress documentation site instead of the cached app shell.

## [3.8.5] - 2026-06-09

### Fixed

- **Help Center docs build** — Removed a broken internal link that blocked the equipqr.info VitePress deployment on Vercel.

## [3.8.4] - 2026-06-09

### Fixed

- **Equipment details mobile inline edit** — Edit buttons stay pinned to the card edge on narrow screens so controls remain reachable without overlapping field values; desktop hover-to-reveal editing is unchanged.

### Changed

- **Equipment details inline editing** — Shared edit-row and icon styling across basic info, identity, location, lifecycle, maintenance notes, custom attributes, and PM schedule fields for consistent layout on phones and tablets.

## [3.8.3] - 2026-06-08

### Added

- **PM interval policies** — Hierarchical preventive-maintenance schedules at equipment, team, and PM template levels, with inherit/custom/no-recurring controls, effective-policy readouts on equipment records, inline PM schedule editing, and team-level PM schedule configuration.
- **Voice dictation in field workflows** — Microphone input on note composers and other text fields so technicians can dictate instead of typing on mobile keyboards.
- **Equipment card grid and quick work orders** — Grid view cards show PM status readouts, last maintenance context, and a work-order menu for faster creation from the fleet list; QR code display is clearer on cards and detail surfaces.
- **Fleet Export Console** — Reports is reorganized into categorized export modules with live record counts, Google Workspace connection status, and an export protocol panel for owners and admins.
- **Inventory list desktop personalization** — Saved views (including built-in purchasing, low-stock, field technician, and accounting layouts), column manager, density toggle, quick-filter chips, stock-level bars, health summary, and bulk actions on the desktop table.

### Changed

- **Equipment PM panel** — Preventive Maintenance on equipment details links open PM work orders and shows progress toward the next due interval.
- **Work order creation entry points** — Equipment and QR quick-action menus use a consolidated dropdown with tooltips for common create paths.
- **Labor entry on notes** — New note entry no longer collects hours worked inline; labor belongs in work-order cost line items while legacy note data continues to display and export.

### Fixed

- **PM schedule inline edit** — Equipment PM schedule edits save reliably from the detail page readout.
- **Inventory desktop table** — Corrected table layout regressions and removed a broken list bulk-edit path that could confuse desktop users.
- **Local dev restart** — `dev-start.bat -Force` stops a running stack before restarting instead of failing with "already running".

## [3.8.2] - 2026-06-07

### Added

- **Playwright user regression coverage** — Expanded critical and full browser suites, run modes, coverage tracking, real-auth integration hooks, and demo action overlays so preview releases can be validated across desktop, mobile, auth, support, privacy, PM template, scan history, and work-order workflows.
- **Fallow codebase intelligence** — Repository scripts and configuration now cover static health, duplication, dead-code, PR risk analysis, and local verification cleanup helpers.

### Changed

- **Maintainability and verification tooling** — Decomposed large runtime components, route declarations, export builders, OAuth callbacks, demo recording helpers, and shared test fixtures while trimming unused packages and obsolete modules surfaced by Fallow.
- **Canonical URL and integration configuration** — OAuth callback URIs now derive from `VITE_SUPABASE_URL` / `SUPABASE_URL`, Edge redirects prefer `PUBLIC_SITE_URL` with legacy `PRODUCTION_URL` fallback, and deprecated QuickBooks/Google Workspace redirect-base environment variables were removed from sync scripts and docs.
- **QuickBooks integration posture** — QuickBooks behavior is scoped to production-connected environments, customer search avoids unsupported and non-queryable fields, and customer imports verify team linking.
- **Vite React plugin** — Switched from the SWC React plugin to the standard Vite React plugin to keep Vitest and production builds quiet under Vite 8/Rolldown.

### Removed

- Obsolete one-off PM seed/generator scripts, unused shadcn UI primitives with no import paths, duplicate work-order/organization/report components, and deprecated enhanced-organization hook layers superseded by current feature services.

### Fixed

- **Preventive maintenance query handling** — PM status lookups now return the first matching row and handle query errors gracefully.
- **Post-signup success view** — Auth no longer auto-redirects away from the check-your-email success screen before the user chooses return to sign-in.
- **Fleet map Google Maps key** — Session refresh and retry when the public maps key edge function returns unauthorized.
- **PM template and QuickBooks UI** — Stable selectors and test hooks for Playwright full-suite coverage.
- **E2E user regression** — Scoped the work order create-button locator to avoid ambiguous matches during creation flows.
- **E2E auth state stability** — Full-suite Playwright runs now always apply setup-generated owner storage state, and the logout lifecycle test restores shared owner auth so later direct dashboard routes stay signed in.
- **E2E creation and offline flows** — Equipment creation helpers now wait for the hydrated equipment search box before opening newly created records, and mobile offline note coverage now asserts the actual offline banner/footer feedback.
- **Verification noise cleanup** — The Vitest wrapper now starts Vitest without Node 24 `shell: true` deprecation warnings, and the PWA service-worker build uses an IIFE output to avoid Vite/Rolldown `inlineDynamicImports` warnings.

## [3.8.1] - 2026-06-01

### Changed

- **Dependency maintenance** — Routine updates to application, development, and CI dependencies (including TanStack Query, Supabase client, Vitest, ESLint, Lucide, date-fns, and GitHub Actions workflow pins) with no intended user-facing behavior changes.
- **React Fast Refresh compliance** — Internal module splits for page back navigation, equipment table columns, and checklist template editor utilities to resolve Fast Refresh lint warnings; no customer-visible workflow changes.

## [3.8.0] - 2026-06-01

### Added

- **Equipment Scan History timeline** — Equipment records now have a single "Scan History" tab that replaces the separate "Scans" and "History" tabs. It shows each QR scan — who scanned, when, and where — alongside the follow-up actions taken in that scan session: work orders created, working hours updated, notes and images added, and opening the full dashboard record. Legacy deep links to the old Scans and History tabs continue to work.
- **Organization Google Drive export destination** — Organization admins can browse Google Drive with a server-backed folder picker and choose one shared folder for work-order PDF, Google Docs, and Google Sheets exports so exports land in a consistent place instead of scattered personal drives.

### Changed

- **Google Workspace connection status** — Shows the connected admin email so organizations can see which account authorized Workspace and Drive access.
- **Google Workspace member import** — Directory sync now requires member email addresses from the synced Workspace directory, reducing incomplete or ambiguous imports.

### Fixed

- **Team invitation emails** — New invitations wait for the email send to finish before showing success, refresh the invite list when delivery fails so admins can resend, and surface Resend API errors instead of silently succeeding.

## [3.6.4] - 2026-05-24

### Changed

- **Internal ITIL workflow guidance** — Simplified agent-facing incident, problem, service request, change record, and issue resolver guidance so routine EquipQR work can move through lightweight triage and focused implementation without unnecessary process ceremony.

### Fixed

- **Signup database repair** — New account creation no longer fails when checking Google OAuth verification; the Supabase helper now reads provider identities from the supported auth identity table and keeps execution limited to authenticated and service-role callers.
- **Post-signup confirmation UX** — After signup succeeds, users now see a dedicated check-your-email page with the submitted email address, email-provider inbox shortcut when available, a return-to-sign-in action, and a longer success toast so the verification step is clear.

## [3.6.3] - 2026-05-24

### Fixed

- **Sign-up password breach check** ([#989](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/989), [#991](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/991)) — Content Security Policy now allows the Have I Been Pwned k-anonymity range API so sign-up can detect compromised passwords instead of failing silently behind CSP.

## [3.6.2] - 2026-05-23

### Added

- **Marketing mobile demo videos** ([#987](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/987)) — PM Templates and QuickBooks feature pages now show autoplaying, looping mobile screen demos above existing screenshots, served from Supabase storage as compact MP4/WebM with poster fallbacks, native controls, and `prefers-reduced-motion` respect.

### Changed

- **Content Security Policy** — Added `media-src` allowances for Supabase-hosted landing demo videos in production and local dev CSP headers.

## [3.6.1] - 2026-05-21

### Fixed

- **SPA route hard reload** ([#982](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/982)) — Hard reloads and deep links to authenticated app routes such as `/dashboard` and `/auth` no longer return Vercel's platform 404; routing fallback restored to the empty app shell after the v3.6.0 marketing prerender split.

- **equipqr-docs CI on preview PRs** — Scope `equipqr-docs` Vercel builds to `main` via `docs/vercel.json` `ignoreCommand`; add `docs/postcss.config.js` so production docs builds resolve Tailwind PostCSS under `docs/`; filter `deployment-status` workflow to ignore `equipqr-docs` deployment events.

### Changed

- Updated `.vscode/extensions.json` with improved extension recommendations.

### Removed

- Bridgemind tooling removed from the project.

## [3.6.0] - 2026-05-17

### Added

- **QuickBooks invoice payment visibility** ([#915](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/915)) — Work Orders now retain mirrored QuickBooks invoice identifiers, lifecycle status, sent/paid timestamps, balance, and due date so managers can see awaiting-payment, overdue, and paid work without leaving EquipQR. The Work Orders list and details surfaces show invoice status badges and add invoice filters for Paid, Unpaid, Overdue, and Not Exported states.

### Changed

- **QuickBooks invoice reliability** ([#600](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/600), [#624](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/624)) — Invoice exports now align with the CJ invoice template using QBO custom fields, customer-facing memo timelines, summarized Labor/Parts lines, fresh QBO tax-status confirmation with cache fallback controls, and safer export/update handling that preserves successful invoice creation even when mirror updates need attention.

- **Public marketing prerender HTML** ([#971](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/971)) — Build-time static HTML for each sitemap-listed marketing URL now returns route-specific headings, descriptive copy, and crawlable navigation inside `#root` for non-JS crawlers, with marketing routes shared by sitemap and prerender generation.

- **Public marketing SEO & accessibility** ([#934](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/934)) — Marketing pages now ship static JSON-LD, a noscript shell, centralized feature SEO copy, breadcrumbs, visible FAQs, matching FAQ/HowTo/BreadcrumbList structured data, SPA route announcements, and route-heading focus handling.

### Fixed

- **Cursor Cloud Agent environment bootstrap failures** — `.nvmrc` now matches the Node 24 runtime required by `package.json`; `scripts/cloud-agent-frontend-setup.sh` loads or installs Node 24 through `nvm` before `npm ci`; Linux `scripts/agent-bootstrap.sh` reads the populated `gcp-read/SERVICE_ACCOUNT_JSON` field before legacy credential fields and validates service-account JSON before writing the gcloud MCP key.

## [3.5.3] - 2026-05-17

### Fixed

- **QuickBooks invoice export** — Summarized **Parts** line includes every non-labor work-order cost (manual and inventory-backed rows; previously separate truck/fee-style amounts roll into Parts). Only cost items matching **Labor** / **Labor - …** (no inventory link) count as labor; customer-facing invoices are Labor and Parts lines only. Private memo still lists the full itemized breakdown.

## [3.5.2] - 2026-05-16

### Changed

- **QuickBooks invoice export** ([#913](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/913)) — Draft invoices use summarized Labor and non-inventory Parts lines, PM-aware customer-facing line descriptions, and optional Edge secrets for item names and income accounts; `QBO_INVOICE_PARTS_ITEM_PREFIX` is deprecated for invoice behavior. Private memo still includes the full itemized cost breakdown.

### Fixed

- **Local test runner** — `useSession` missing-provider coverage uses `renderHook` so React 18 does not leave the Vitest process wedged; raise the default `scripts/test-runner.mjs` hard wall-clock timeout (`8m` standard runs, `10m` with coverage cap) so full `npm test` can finish on Windows after lint/typecheck without false `⏰ Test runner timeout` exits.

## [3.5.1] - 2026-05-16

### Added

- **QuickBooks customer contact sync** ([#914](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/914), [#960](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/960)) — QuickBooks customer imports and refreshes now capture email, phone, mobile, and fax contacts, show their QuickBooks provenance, and surface tap-to-call / tap-to-email actions on linked work orders without adding write-back to QuickBooks.
- **Public documentation site bootstrap (VitePress)** ([#908](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/908), [#956](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/956)) — `docs/` builds as a standalone static site (VitePress) for deployment to `equipqr.info`; runbook updates in deployment and CI/CD docs; app footer links to published docs.
- **PR feedback PowerShell helpers** — `scripts/pr-feedback/` drivers for PR context preflight, GraphQL review threads/reviews, local verification gates, deferred-issue + thread-reply + summary publishing, and `gh pr checks`, with `scripts/pr-feedback/tests/Run-PrFeedbackSmoke.ps1` and skill doc references via `scripts/pr-feedback/README.md`.

### Changed

- **Public docs security** ([#956](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/956)) — Exclude `docs/ops/**` from the equipqr.info VitePress build; remove Operations from public nav; README ops links use GitHub `blob/main`; tighten `Content-Security-Policy` `script-src` to `'self'` only (no `unsafe-inline` / `unsafe-eval`); add public vs internal authoring guidance; fix PM/RCA README links for GitHub.

### Fixed

- **Mobile work order details UX** ([#829](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/829), [#958](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/958)) — Sticky footer owns primary actions with PM checklist completion gating; hides duplicate Next action when the footer is visible; trims duplicate compact-summary rows from mobile details; mobile admin delete requires typing DELETE.
- **Mobile work order cost editor** ([#903](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/903), [#957](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/957)) — Touch-friendly stacked actions for labor, inventory, and manual lines; duplicate Cost Items chrome suppressed on small screens; inline validation deferred until Save or row edits; overflow clamps on notes/timeline/image carousel regions.

## [3.5.0] - 2026-05-15

### Added

- **QR PM template picker for untemplated equipment** ([#916](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/916), [#941](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/941)) — QR work-order creation now surfaces a template chooser when scanned equipment has no default PM template, preserving the fast QR flow while preventing empty-template submissions.

### Changed

- **Dependabot update cadence** — GitHub dependency update runs are reduced to monthly to lower churn and keep supply-chain updates bundled into deliberate review windows.
- **ITIL workflow guidance for issue-tied implementation** — Internal skill/rule docs now require triage before Change Records and enforce PR-based delivery for issue-tracked implementation flows.

### Fixed

- **QR organization context handoff** — QR redirect and downstream flows keep organization switching synchronized across providers/contexts so QR users land in the expected org-scoped state.
- **Desktop sidebar layout regression** — Restored sidebar content offset behavior to prevent visual overlap/misalignment in desktop dashboard navigation.
- **QR PM template submit hardening** ([#941](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/941)) — Added validation and label-association guardrails to improve template selection reliability in QR PM work-order creation.

## [3.4.0] - 2026-05-14

### Added

- **Preview Edge secret sync (CI)** ([#906](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/906)) — `scripts/sync-supabase-secrets-from-1password.ps1` reads `ProjectRef` from each edge 1Password item, uses `supabase-write` / `SUPABASE_ACCESS_TOKEN`, validates placeholders and TOKEN_ENCRYPTION_KEY / KDF_SALT strength, compares SHA-256 digests in `-Check` mode (JSON list output trimmed for CLI banners), and applies via `supabase secrets set --env-file`. Non-prod **Secrets Fan-Out** Supabase job calls this script for `edge-env-preview-secrets`; auth probe loads the Supabase PAT from 1Password. The `supabase-write` PAT is stored in 1Password as field `SUPABASE_ACCESS_TOKEN` (replacing legacy `credential`); `schema-drift-check` uses the same op:// reference. **Secrets Fan-Out (Non-Prod)** runs digest-only (`-Check`) on `push` to `preview` when this workflow or the sync script changes; the 6-hour UTC `schedule` applies preview Edge secrets (GitHub evaluates scheduled workflows from `main`, so the cron runs after this file exists on the default branch). Manual `workflow_dispatch` unchanged; production remains drift-check only until a future apply workflow.

- **QR scan feedback** ([#839](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/839)) — Live camera scans on `/dashboard/scan` prepare Web Audio on the Start camera gesture, set a short-lived session marker on successful decode, and play a synthesized ping plus vibration when `/qr/*` redirect access resolution completes. Upload-based decodes and direct QR opens stay silent. Development builds only: `/debug-scan-feedback` to audition the tone.

### Changed

- **Node.js 24 LTS runtime matrix** ([#931](https://github.com/Columbia-Cloudworks-LLC/EquipQR/pull/931)) — `engines.node` is `24.x` (aligned with `@types/node` 24.x). GitHub Actions default to Node **24.x**; setup and CI docs describe the same supported line.

- **PageSEO / document metadata** — Removed the `react-helmet-async` dependency; `PageSEO` now updates `document.title` and head tags via a small scoped effect (tags marked `data-equipqr-page-seo` for cleanup). `HelmetProvider` was dropped from app and test providers.
- **Dynamic imports for heavy libraries** — Converted `xlsx` (~200KB), `jspdf` (~150KB), and `qrcode` (~100KB) from static imports to on-demand `import()` calls, reducing the initial JS bundle by ~450KB. Libraries now load only when users trigger Excel exports, PDF generation, or QR code display.

## [3.3.2] - 2026-05-10

### Fixed

- **Equipment QR scan hero image** — `/qr/equipment/:id` now resolves `equipment.image_url` the same way as dashboard equipment views (signed URLs for private `work-order-images` / `equipment-note-images` paths). Hero image uses `onError` fallback to the forklift placeholder when a signed URL fails.

## [3.3.1] - 2026-05-10

### Added

- **In-app QR scanner and PM summary on equipment QR landing** — Protected `/dashboard/scan` route (lazy `qr-scanner` chunk) decodes EquipQR equipment, inventory, and work-order links into existing `/qr/*` flows; mobile dashboard hero and bottom nav open the scanner. Equipment QR landing shows a non-blocking last completed PM card with checklist sections and a deep link to `/dashboard/work-orders/:id?action=pm`; work order details scrolls to the PM checklist and clears only the `action` query param.

- **Work order creation photos & primary image** ([#726](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/726)) — QR scan dialog and authenticated create/request forms accept up to five evidence photos (same MIME/size rules as notes). First uploaded image sets work_orders.primary_image_id and appears first with a Primary badge in the work order images carousel. Offline create with photos is blocked with the same messaging as inline notes.

## [3.3.0] - 2026-05-09

### Added

- **Schema-drift CI gate** ([#735](https://github.com/Columbia-Cloudworks-LLC/EquipQR/issues/735)) - New `.github/workflows/schema-drift-check.yml` + `.github/scripts/check-schema-drift.js` compare `supabase/migrations/*.sql` against the production `supabase_migrations.schema_migrations` table and fail any `preview -> main` PR whose local migrations include a NAME not yet on production. PRs targeting `preview` and pushes to `preview` warn instead of failing (drift is expected day-to-day; the gate only blocks the release boundary). Matching is by name not version so the documented timestamp-drift duplicates (e.g. `apply_pending_admin_grants_quiet_mismatch`, `remote_schema`) don't false-positive. Workflow mirrors `edge-functions-smoke-test.yml` for token loading and degrades gracefully when `OP_SERVICE_ACCOUNT_TOKEN` is absent (fork PRs / pre-token-plant).

## [2.10.0] - 2026-04-18

### Added

- **Machine hours on work order and equipment notes** — Nullable `machine_hours` column (migration `20260416120000_add_machine_hours_to_notes.sql`) with create/list/offline-sync support.

## [2.9.0] - 2026-04-06

### Added

- **Customer account model behind Teams** — CRM-style customer records linked to teams, QuickBooks import/refresh/link flows, and external contacts.

## [2.8.0] - 2026-04-06

### Added

- **QR codes on work order PDF printouts** — Service Report and Field Worksheet PDFs include repeating Work Order and Equipment QR codes.

## [2.7.1] - 2026-04-05

### Changed

- **User Settings page redesign** — Settings navigation and organization settings moved toward a denser GitHub/Linear-style admin layout.

## [2.7.0] - 2026-04-04

### Added

- **Export artifact lineage and Google Docs packet** — Google Docs export remembers/replaces previous artifacts and routes files through team/equipment subfolders.

### Fixed

- **README version badge** — Updated from `2.5.2` to `2.7.0` to match the current release.

## [2.6.0] - 2026-04-04

### Added

- **Better Stack monitoring and privacy/DSR controls** — Health checks, CCPA/CPRA request handling, privacy settings, and Google Docs destination configuration.

## [2.5.2] - 2026-03-27

### Changed

- **Mobile UI consistency** — Dashboard, equipment, work orders, and inventory detail surfaces received mobile consistency and accessibility updates.

## [2.5.1] - 2026-03-22

### Fixed

- **App sidebar horizontal scrollbar** — Active nav accent no longer causes horizontal overflow.
- **Work order form equipment dropdown** — Popover stacking no longer hides the equipment picker behind the modal.

## [2.5.0] - 2026-03-22

### Added

- **Fleet Map auto-fit and dashboard FAB/KPI sparklines** — Map viewport controls plus dashboard mobile quick actions and KPI sparklines.

## [2.4.0] - 2026-03-16

### Added

- **SOC-2 session lifecycle and security notifications** — Idle-session timeout, security event notifications, trust page, and global sign-out.

## [2.3.10] - 2026-03-15

### Added

- **PM interval tracking foundation** — PM interval schema, status RPCs, seed scenarios, and UI status indicators.

## [2.3.9] - 2026-03-13

### Added

- **Landing pricing, roadmap, and footer** — Public landing expansion and Supabase port preparation tooling.

## [2.3.8] - 2026-03-12

### Changed

- Rolled up the current set of in-progress repository updates into the 2.3.8 release version so package metadata and project documentation stay aligned for the next release cycle.

## [2.3.7] - 2026-03-06

### Added

- **Work Order card enrichment** — Equipment metadata and location context in desktop/mobile work order cards.

## [2.3.6] - 2026-03-06

### Fixed

- **Dashboard hover effect causes scrollbars** — Removed scaling hover effect that triggered page overflow.

## [2.3.5] - 2026-02-26

### Fixed

- **Dashboard stuck in edit mode on mobile** — Mobile detection and grid behavior no longer trap the dashboard in edit mode.

## [2.3.4] - 2026-02-10

### Fixed

- **Storage bucket creation and RLS hardening** — Missing buckets and tenant-scoped storage policies are migration-managed.

## [2.3.3] - 2026-02-10

### Added

- **Image Upload Feature** — Organization logos, user avatars, team images, and inventory images moved to Supabase Storage uploads.
- **Multi-Factor Authentication (MFA)** — TOTP-based MFA with admin enforcement and settings flows.
- **One-click dev environment scripts** — Windows start/stop scripts for Vite + Supabase development.

## [2.3.2] - 2026-02-10

### Added

- **Customizable dashboard grid system** — User-configurable dashboard widgets with persistence and new PM/equipment/cost widgets.

## [2.3.1] - 2026-02-09

### Added

- **Production CSP and SEO/accessibility improvements** — Security headers, skip navigation, legal PageSEO, and query-key cleanup.

## [2.3.0] - 2026-02-09

### Added

- **Geolocation hierarchy and Google Maps integration** — Team/manual/scan location hierarchy across equipment, teams, Fleet Map, and work orders.

## [2.2.4] - 2026-02-08

### Added

- **In-app bug reporting with GitHub integration** — Support-page issue reporting, ticket tracking, diagnostics, and GitHub sync.

## [2.2.3] - 2026-02-01

### Added

- **Voice-to-Text for technician notes** — Browser speech input for notes and descriptions.
- **Clipboard image paste for notes** — Paste screenshots/images directly into note composers.
- **Google Workspace export integration** — Google Sheets and Drive export paths for work orders.

## [2.2.2] - 2026-01-27

### Added

- **SEO Improvements and horizontal chip rows** — Sitemap generation, per-route metadata, and consistent horizontally scrollable filter chips.

## [2.2.1] - 2026-01-26

### Added

- **Online Status Hook and QuickBooks developer skill** — Online/offline tracking plus developer guidance for QBO API work.

## [2.2.0] - 2026-01-26

### Added

- **Web Push Notifications** — Full PWA push notification subscriptions/preferences and realtime broadcast infrastructure.

## [2.1.3] - 2026-01-24

### Added

- **Google Workspace member import from Organization Members** — Admin import flow from connected directory.

## [2.1.2] - 2026-01-24

### Added

- **Automatic Schema Export** — GitHub Action exports schema after main pushes.

## [2.1.1] - 2026-01-24

### Fixed

- **Google Workspace Members Not Appearing** — Pending Workspace member claims now appear in organization member views.

## [2.1.0] - 2026-01-14

### Added

- **Google Workspace Integration** — Workspace directory OAuth, domain claims, member provisioning, edge-function auth helpers, and migration baseline.

## [2.0.0] - 2026-01-13

### Added

- **Comprehensive Audit Trail System** — Organization-wide immutable audit logging and entity history.
- **Organization Danger Zone** — Ownership transfer, leave organization, and delete organization workflows.
- **Enhanced Report Export System** — Customizable server-side report export and work-order Excel packets.

## [1.8.1] - 2026-01-12

### Fixed

- **Equipment Form Dropdown Overflow** — Replaced `<datalist>` with responsive autocomplete component.

## [1.8.0] - 2026-01-12

### Added

- **Part Alternate Groups System** — Equivalent/interchangeable part groups with identifiers and verification.
- **Part Lookup Page** — Search by part number or equipment compatibility.
- **Organization-Level Parts Managers** — Organization-wide parts management permissions.

## [1.7.13] - 2026-01-11

### Added

- **User Journey Testing Framework** — Persona-driven integration-style test infrastructure and PM compatibility management.

## [1.7.12] - 2026-01-10

### Added

- **Part Compatibility Rules** — Manufacturer/model rule-based inventory compatibility.

## [1.7.11] - 2026-01-08

### Changed

- **PM Checklist Notes** — Negative maintenance conditions auto-expand notes and improve item-note interactions.

## [1.7.10] - 2026-01-08

### Changed

- **Work Order Card mobile UX** — Cards became tappable and simpler for field scanning.

## [1.7.9] - 2026-01-08

### Changed

- **Equipment List mobile UX** — Compact mobile rows, condensed filters, and mobile sort improvements.

## [1.7.8] - 2026-01-07

### Changed

- **Work Order Card Consolidation** — Desktop/mobile wrappers now share the unified card implementation.

## [1.7.7] - 2026-01-07

*Changes for this version were not documented in the changelog.*

## [1.7.4] - 2026-01-02

### Removed

- **PrintExportDropdown Component** — Removed legacy PDF generation and print export controls.

### Security

- **esbuild Vulnerability Fix** — Updated esbuild to address a moderate vulnerability.

## [1.7.3] - 2026-01-02

### Removed

- **Deprecated Multi-Equipment Support** — Removed multi-equipment work-order selector and disabled automated versioning workflow.

## [1.7.2] - 2026-01-01

### Added

- **Work Order PDF Export Dialog** — Customer-facing PDF export controls with note/cost visibility rules.
- **QuickBooks Integration** — Captures `intuit_tid` response identifiers for export/search support.

### Fixed

- **Work Order Editing** — Preserve assignee when editing work orders.

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
