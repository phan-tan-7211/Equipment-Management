# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to ZNTEQR by ZNT LLC will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries through 3.28.0 are more verbose than the current policy. Newer notes are short customer-facing outcomes. Editorial rules live in `.cursor/rules/changelog.mdc`.

## [Unreleased]

## [3.34.10] - 2026-09-15

### Changed

- Public account creation is now invite-only in production so employees cannot create unrelated organizations.


## [3.34.9] - 2026-09-15

### Added

- Invited employees can create their own email/password account on mobile and join the inviting organization without creating a separate workspace.


## [3.34.8] - 2026-09-15

### Changed

- Public release notes now follow the selected Vietnamese, English, or Korean language.

## [3.34.7] - 2026-09-15

### Added

- Localized the complete Privacy Policy body for Vietnamese and Korean.

## [3.34.6] - 2026-09-15

### Added

- Added Vietnamese, English, and Korean language switching across the remaining public legal and feature pages.

## [3.34.5] - 2026-09-15

### Changed

- Centralized production deployment configuration in GitHub, removed hard-coded Vercel target IDs from release tooling, and removed 1Password from the Vercel production release path.

## [3.34.4] - 2026-09-15

### Changed

- Completed the ZNTEQR deep-cleanup follow-up by renaming remaining active internal runtime identifiers and moving the Help Center welcome article to the canonical `welcome-to-znteqr` slug while preserving the legacy URL with a permanent redirect.

## [3.34.3] - 2026-09-15

### Changed

- **ZNTEQR brand consistency** — Customers, assistive technologies, and public documentation now consistently identify the equipment platform as ZNTEQR.

## [3.34.2] - 2026-09-15

### Changed

- **Localized shared error handling** — Generic error titles, fallback messages, and recovery guidance now follow the selected Vietnamese, English, or Korean language.


## [3.34.1] - 2026-09-15

### Changed

- **VI/EN/KO localization completion** — Remaining user-facing work-order, PM, note, image, loading, accessibility, cookie-consent, and equipment feedback now follows the selected Vietnamese, English, or Korean language without changing stored business data.


## [3.34.0] - 2026-09-14

### Changed

- **ZNTEQR brand consistency** — Product copy, documentation, tests, PWA notifications, SEO metadata, and internal source identifiers now use the ZNTEQR brand. Existing equipqr.app URLs and persisted browser keys remain compatible.

## [3.33.0] - 2026-09-13

### Changed

- **Member roster localization** — Placeholder names for pending invitations, Google Workspace claims, and unknown members now display in Vietnamese, English, and Korean.

- **Equipment localization follow-up** — Remaining equipment form hints, bulk-edit controls, loading text, media labels, and note confirmation now display in Vietnamese, English, and Korean.

- **Work Orders mobile list localization** — Mobile search, filters, sorting, work-order cards, and auto-assignment prompts now display in Vietnamese, English, and Korean.

- **Work Orders list localization** — Work Orders browsing now supports Vietnamese, English, and Korean across desktop search, filters, sorting, active filter labels, empty states, and list/calendar view controls. (#4)

## [3.32.1] - 2026-09-12

### Changed

- **Equipment localization** — Equipment workflows now support Vietnamese, English, and Korean across lists, details, forms, QR scanning, PM, media, parts, filters, sorting, working hours, and equipment groups.

## [3.32.0] - 2026-09-06

### Added

- **Work order calendar (#1530)** — Desktop planners can switch Work Orders to a month, week, or day calendar, drag due dates, and set optional due times.
- **Work order list pages (#1534)** — The Work Orders list now pages on the server so large organizations no longer load every work order at once.
- **PM template groups (#1536)** — ZNTEQR and organization sections on PM Templates can collapse. ZNTEQR starts closed when the organization already has a custom template.

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

- **Public releases page (#1460)** — The Legal footer version link now opens a public `/releases` page with build-time release notes from the ZNTEQR changelog.

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
- **Starter PM template titles stay readable** — ZNTEQR starter cards now keep template names readable even when both ZNTEQR and Protected badges are present.
- **Fleet Map Team HQ marker stays interactive (#1461)** — Clicking a team headquarters marker now keeps the map mounted and opens the team popup.