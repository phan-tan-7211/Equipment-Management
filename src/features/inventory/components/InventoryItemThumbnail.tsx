import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Package } from 'lucide-react';
import type { InventoryItem } from '@/features/inventory/types/inventory';
import { getPrimaryInventoryItemImageRefs } from '@/features/inventory/services/inventoryListThumbnailService';
import {
  batchResolveInventoryItemImageDisplayUrls,
  displayableImageSrc,
  getInventoryItemDisplayImageUrl,
} from '@/services/imageUploadService';
import { cn } from '@/lib/utils';

type InventoryThumbnailItem = Pick<InventoryItem, 'id' | 'organization_id' | 'image_url'>;

type InventoryThumbnailUrls = {
  src: string | null;
  hoverSrc: string | null;
};

type PendingThumbnailResolution = {
  key: string;
  item: InventoryThumbnailItem;
  resolve: (urls: InventoryThumbnailUrls) => void;
};

type ImageHover = {
  x: number;
  y: number;
  size: number;
};

const thumbnailResolutionCache = new Map<string, Promise<InventoryThumbnailUrls>>();
const pendingThumbnailResolutions = new Map<string, PendingThumbnailResolution>();
let thumbnailFlushScheduled = false;
const IMAGE_HOVER_TRANSITION_MS = 140;

function thumbnailCacheKey(item: InventoryThumbnailItem): string {
  return `${item.organization_id}:${item.id}:${item.image_url ?? ''}`;
}

function getImageHoverPosition(clientX: number, clientY: number): ImageHover {
  const margin = 12;
  const gap = 14;
  const size = Math.min(
    360,
    Math.max(180, window.innerWidth - margin * 2),
    Math.max(180, window.innerHeight - margin * 2),
  );
  let x = clientX + gap;
  let y = clientY - size - gap;

  if (x + size > window.innerWidth - margin) x = clientX - size - gap;
  x = Math.max(margin, Math.min(x, window.innerWidth - size - margin));
  y = Math.max(margin, Math.min(y, window.innerHeight - size - margin));

  return { x, y, size };
}

async function flushPendingThumbnailResolutions(): Promise<void> {
  thumbnailFlushScheduled = false;
  const batch = [...pendingThumbnailResolutions.values()];
  pendingThumbnailResolutions.clear();

  if (batch.length === 0) return;

  const byOrganization = new Map<string, PendingThumbnailResolution[]>();
  for (const pending of batch) {
    const organizationBatch = byOrganization.get(pending.item.organization_id) ?? [];
    organizationBatch.push(pending);
    byOrganization.set(pending.item.organization_id, organizationBatch);
  }

  for (const [organizationId, organizationBatch] of byOrganization) {
    let primaryRefs: Record<string, string> = {};
    try {
      primaryRefs = await getPrimaryInventoryItemImageRefs(
        organizationId,
        organizationBatch.map((pending) => pending.item.id),
      );
    } catch {
      // Preserve legacy image_url fallback if image metadata is temporarily unavailable.
    }

    const storedRefs = organizationBatch.map(
      (pending) => primaryRefs[pending.item.id] ?? pending.item.image_url ?? null,
    );

    let resolvedUrls: (string | null)[];
    try {
      resolvedUrls = await batchResolveInventoryItemImageDisplayUrls(
        storedRefs,
        { variant: 'thumb' },
      );
    } catch {
      resolvedUrls = storedRefs.map((storedRef) => displayableImageSrc(storedRef));
    }

    organizationBatch.forEach((pending, index) => {
      thumbnailResolutionCache.delete(pending.key);
      const src = resolvedUrls[index] ?? displayableImageSrc(storedRefs[index]) ?? null;
      pending.resolve({
        src,
        // V2 hover previews use the immutable 512px variant. Legacy refs keep
        // the already-resolved thumbnail because they have no parallel set.
        hoverSrc: getInventoryItemDisplayImageUrl(storedRefs[index], 'preview') ?? src,
      });
    });
  }
}

function resolveThumbnailUrl(item: InventoryThumbnailItem): Promise<InventoryThumbnailUrls> {
  const key = thumbnailCacheKey(item);
  const cached = thumbnailResolutionCache.get(key);
  if (cached) return cached;

  const pending = new Promise<InventoryThumbnailUrls>((resolve) => {
    pendingThumbnailResolutions.set(key, { key, item, resolve });

    if (!thumbnailFlushScheduled) {
      thumbnailFlushScheduled = true;
      void Promise.resolve().then(flushPendingThumbnailResolutions);
    }
  });

  thumbnailResolutionCache.set(key, pending);
  return pending;
}

export function InventoryItemThumbnail({
  item,
  enableHover = true,
  size = 'sm',
}: {
  item: InventoryThumbnailItem;
  enableHover?: boolean;
  size?: 'sm' | 'md';
}) {
  const itemId = item.id;
  const organizationId = item.organization_id;
  const legacyImageUrl = item.image_url;
  const [imageUrls, setImageUrls] = useState<InventoryThumbnailUrls | null>(null);
  const [imageHover, setImageHover] = useState<ImageHover | null>(null);
  const imageSrc = imageUrls?.src ?? null;
  const imageHoverSrc = imageUrls?.hoverSrc ?? imageSrc;
  const [imageHoverVisible, setImageHoverVisible] = useState(false);
  const imageHoverCloseTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setImageUrls(null);

    void resolveThumbnailUrl({
      id: itemId,
      organization_id: organizationId,
      image_url: legacyImageUrl,
    }).then((resolved) => {
      if (active) setImageUrls(resolved);
    });

    return () => {
      active = false;
    };
  }, [itemId, organizationId, legacyImageUrl]);

  useEffect(() => () => {
    if (imageHoverCloseTimer.current !== null) {
      window.clearTimeout(imageHoverCloseTimer.current);
      imageHoverCloseTimer.current = null;
    }
  }, []);

  const clearImageHoverCloseTimer = () => {
    if (imageHoverCloseTimer.current === null) return;
    window.clearTimeout(imageHoverCloseTimer.current);
    imageHoverCloseTimer.current = null;
  };

  const closeImageHover = () => {
    setImageHoverVisible(false);
    if (imageHoverCloseTimer.current !== null) return;
    imageHoverCloseTimer.current = window.setTimeout(() => {
      setImageHover(null);
      imageHoverCloseTimer.current = null;
    }, IMAGE_HOVER_TRANSITION_MS);
  };

  const openImageHover = (clientX: number, clientY: number) => {
    if (
      !enableHover ||
      !imageSrc ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      closeImageHover();
      return;
    }

    clearImageHoverCloseTimer();
    setImageHover(getImageHoverPosition(clientX, clientY));
    setImageHoverVisible(true);
  };

  return (
    <>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted',
          size === 'md' ? 'h-12 w-12' : 'h-10 w-10',
          enableHover && imageSrc && 'cursor-zoom-in',
        )}
        data-inventory-item-thumbnail
        onPointerEnter={enableHover ? (event) => openImageHover(event.clientX, event.clientY) : undefined}
        onPointerMove={enableHover ? (event) => openImageHover(event.clientX, event.clientY) : undefined}
        onPointerLeave={enableHover ? closeImageHover : undefined}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
        </div>
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => {
              setImageUrls(null);
              closeImageHover();
            }}
          />
        )}
      </div>
      {imageHover && imageSrc && typeof document !== 'undefined'
        ? createPortal(
            <div
              className={cn(
                'inventory-item-image-hover-preview pointer-events-none fixed z-[9999] box-border overflow-hidden rounded-xl border border-border bg-white p-2 shadow-2xl transition-[opacity,transform] duration-150 ease-out dark:bg-card',
                imageHoverVisible ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0',
              )}
              data-inventory-item-image-hover-preview
              aria-hidden="true"
              style={{
                left: imageHover.x,
                top: imageHover.y,
                width: imageHover.size,
                height: imageHover.size,
              }}
            >
              <img
                src={imageHoverSrc ?? imageSrc}
                alt=""
                className="block h-full w-full rounded-md bg-white object-contain dark:bg-card"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
