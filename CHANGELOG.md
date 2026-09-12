# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to EquipQR by ZNT LLC will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries through 3.28.0 are more verbose than the current policy. Newer notes are short customer-facing outcomes. Editorial rules live in `.cursor/rules/changelog.mdc`.

## [Unreleased]

### Changed

- **Inventory list localization** — Inventory list and browse controls now support Vietnamese, English, and Korean.

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

- **Calendar panel close (#1533)** — The work-order side panel X now dismisses the panel.
- **Calendar create leftover** — Cancelling a new work order from a calendar slot no longer leaves a ghost event on the grid.

## [3.29.1] - 2026-08-26

### Fixed

- **Production promote verification follows the serving build** — Release Readiness now verifies the production deployment created by `vercel promote`, so successful promotes and same-SHA reruns no longer stop before Edge Function deploy.
