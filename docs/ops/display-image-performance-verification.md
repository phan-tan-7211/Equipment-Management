# Display-image performance verification runbook

Status: Phase 8 preparation only. This document is a read-only verification guide; it does not change application behavior, Supabase schema or policies, or deployment configuration.

The runbook is intended to be executed after the display-image phases have been merged into one approved preview, staging, or isolated test environment. It does not constitute performance evidence by itself.

## Safety and test boundary

- Use a non-production account, organization, and image fixtures in an approved environment.
- The Ctrl+V upload and delete-image checks are write operations. Never use them against production data.
- Do not call production APIs from a scripted check, and do not paste access tokens, signed query strings, cookies, or other secrets into evidence.
- Keep legacy private attachment checks separate. Work-order and equipment-note attachments must remain private and are not part of the public V2 display-image measurement.
- Capture evidence only with browser DevTools and local/offline notes. No schema, policy, bucket, cache, or application changes are required for this phase.

## Expected URL classes

Classify every image request before adding it to the evidence table.

| URL class | Expected shape | How to record it |
| --- | --- | --- |
| V2 public display image | `/storage/v1/object/public/display-images/org/{orgId}/{equipment|inventory}/{entityId}/{imageSetId}/{thumb|preview|full}.webp` | Public immutable V2 URL; no signed token and no `createSignedUrls` call. |
| Legacy private display image | Legacy bucket/path resolved through `/storage/v1/object/sign/...` or an equivalent signed URL with a query token | Record as legacy fallback, not as a V2 result. Redact the token before exporting evidence. |
| Private attachment | Work-order or equipment-note attachment path | Exclude from the V2 display-image totals; verify that it is not made public by this test. |

A V2 URL must be recognizable from its public `display-images` path and `.webp` variant name. A signed URL, a legacy bucket, or a URL with a signing token is not a V2 public result.

## DevTools setup

Use Chrome or Edge DevTools with the following settings:

1. Open the approved environment and sign in with the test account.
2. In **Network**, enable **Preserve log**, show the **Img** resource type, and keep the URL, Status, Size/Transferred, and Resource Size columns visible.
3. Use **Disable cache** only for a deliberately cold-network capture. Leave it unchecked for warm navigation and service-worker cache observations.
4. Clear the Network log before each flow checkpoint. Do not treat an empty byte value for a memory/disk/service-worker hit as zero; record it as `N/A` when DevTools does not expose the value.
5. In **Application**, inspect **Service Workers** and **Cache Storage**. For V2, the expected cache is `equipqr-display-images-v2`.
6. If the build exposes client-call telemetry or console instrumentation, count calls named `createSignedUrls`. Independently count requests to `/storage/v1/object/sign/`; label that second value as the signed-endpoint count, not as an exact client-call count when instrumentation is unavailable.

For each checkpoint, record both:

- **Request count:** all image resource rows observed, plus the number of unique V2 URLs.
- **Bytes:** the **Transferred** value and the **Resource Size** value separately. For cache-served rows, retain the cache source instead of converting an unavailable byte value to zero.

## Cache-source evidence

Record the source shown by DevTools for each image request:

| Source | Evidence |
| --- | --- |
| Network | Normal request with transferred bytes. |
| Memory cache | Network row says `from memory cache`; count separately from disk cache. |
| Disk cache | Network row says `from disk cache`; count separately from memory cache. |
| Service worker | Network row says `from ServiceWorker`; verify the matching URL is present in `Application > Cache Storage > equipqr-display-images-v2`. |

The cache check is about browser resource caching, not JavaScript heap usage. Do not claim a heap-memory improvement from this runbook alone.

## Test procedure

Run each flow twice where applicable:

- **Cold first open:** clear only the approved environment's site data/cache as permitted by the maintainer, open the route, and capture requests until the screen is stable.
- **Warm/repeat navigation:** keep the service worker and browser caches intact, repeat the navigation, and capture which requests are served from memory, disk, or `equipqr-display-images-v2`.

### Equipment flow

Execute this sequence in the approved environment:

1. First open of Equipment and capture the initial list/card/table image requests.
2. Navigate **Work Orders → Equipment** and capture the route-entry requests.
3. Navigate **page 1 → page 2 → page 1**. Record request counts, bytes, cache sources, and whether the V2 URL strings stay unchanged.
4. Hover an equipment image. The hover request, if not already cached, must use `preview.webp`.
5. Open an equipment detail view. The detail surface may load the canonical `full.webp` variant; it must not trigger signed URL generation for a V2 image.

For each list page, confirm that a `full.webp` request is not caused by the list surface. Do not count private Work Order or equipment-note attachments as display-image requests.

### Inventory flow

Execute this sequence in the approved environment:

1. First open of Inventory and capture the initial thumbnail requests.
2. Leave the Inventory menu, return to Inventory, and capture repeat-navigation requests and cache sources.
3. Hover an inventory thumbnail. The hover request, if needed, must use `preview.webp`.
4. Open the inventory editor. The editor may load `full.webp`.
5. Paste a new JPEG/PNG with **Ctrl+V** using a non-production fixture. Observe the image flow without exporting any secret-bearing request data.
6. Change the primary image and verify that the canonical V2 URL does not change merely because primary/order changed.
7. Delete the test image and verify only in the approved non-production environment. Record whether any unexpected signed URL or legacy request appears.

For the Inventory list, confirm that no `full.webp` is requested. The editor is the intentional full-resolution surface.

## Evidence worksheet

Use one row per checkpoint. Keep V2 and legacy counts separate.

| Flow/checkpoint | V2 image requests | Unique V2 URLs | Legacy/signed image requests | Transferred bytes (V2) | Resource Size bytes (V2) | Memory/disk/SW cache evidence | `createSignedUrls` calls | Signed-endpoint requests | URL unchanged on repeat | Result/notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- |
| Equipment first open |  |  |  |  |  |  |  |  |  |  |
| Work Orders → Equipment |  |  |  |  |  |  |  |  |  |  |
| Equipment page 1 → 2 → 1 |  |  |  |  |  |  |  |  |  |  |
| Equipment hover |  |  |  |  |  |  |  |  |  |  |
| Equipment detail |  |  |  |  |  |  |  |  |  |  |
| Inventory first open |  |  |  |  |  |  |  |  |  |  |
| Inventory leave menu → return |  |  |  |  |  |  |  |  |  |  |
| Inventory thumbnail hover |  |  |  |  |  |  |  |  |  |  |
| Inventory editor |  |  |  |  |  |  |  |  |  |  |
| Inventory Ctrl+V fixture |  |  |  |  |  |  |  |  |  |  |
| Inventory primary change |  |  |  |  |  |  |  |  |  |  |
| Inventory delete fixture |  |  |  |  |  |  |  |  |  |  |

When a list-to-detail transition is tested, keep the list checkpoint and detail checkpoint separate. This prevents the intentional detail/editor `full.webp` request from being mistaken for a list request.

## Hard PASS gates

The integrated approved environment passes Phase 8 only when the evidence supports all of these gates:

- V2 display-image flows produce **zero `createSignedUrls` calls** and zero V2 signed-endpoint requests.
- Equipment and Inventory list surfaces use `thumb.webp`.
- Image hover uses `preview.webp`.
- Equipment detail and Inventory editor use `full.webp`.
- A list surface does not load `full.webp`; detail/editor are the only intentional full-resolution surfaces. If “detail must not load full.webp” is intended literally, that conflicts with the explicit detail/editor=`full.webp` requirement and must be resolved before sign-off.
- Repeating navigation keeps the same immutable V2 URL string for the same image set and variant; cache source may change from Network to memory, disk, or service worker.
- Legacy signed URLs occur only for explicitly legacy fixtures and never for a V2 public reference.
- The V2 cache contains only the expected public display-image requests; PostgREST, Auth, Functions, Realtime, signed URLs, and private attachments are not counted as V2 cache hits.

## Practical byte targets

These are practical targets for the measured WebP resource size and are not a byte-perfect contract. Record actual Transferred and Resource Size values even when a target is missed; cache state, source dimensions, and browser behavior can change the observed numbers.

| Variant | Practical target |
| --- | ---: |
| `thumb.webp` | ≤ 30 KB |
| `preview.webp` | ≤ 120 KB |
| `full.webp` | ≤ 350 KB |

A target miss is a performance observation to review, not an automatic application-behavior failure. The hard URL, variant-routing, signing, and list/full separation gates remain mandatory.

## Maintainer sign-off

The maintainer should attach the completed worksheet (with secrets and signed query tokens redacted), the approved environment and commit/merge identifier, and the DevTools cache evidence. Mark this Phase 8 preparation as **evidence pending** until the full Phase 1–7 integration has been tested.

This runbook does not merge branches, create a pull request, deploy, mutate production Supabase, backfill data, or delete legacy objects.
