import { toast } from 'sonner';
import type { QueuedNoteCreateResult } from '@/components/common/noteSubmitTypes';
import type { NoteCreateMutationInput } from '@/components/common/noteCreateMutationTypes';
import { logger } from '@/utils/logger';
import { getRuntimeFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraRuntime';

export type { NoteCreateMutationInput };

export async function runOfflineAwareNoteCreate<TData>(options: {
  input: NoteCreateMutationInput;
  organizationId: string | undefined;
  userId: string | undefined;
  offlineCreate: (
    input: NoteCreateMutationInput,
  ) => Promise<{ queuedOffline: true; hadImages: boolean } | { queuedOffline: false; data: TData }>;
  onlineCreate: (input: NoteCreateMutationInput) => Promise<TData>;
  requireOrganization?: boolean;
}): Promise<{ queuedOffline: true; hadImages: boolean } | { queuedOffline: false; data: TData }> {
  const { input, organizationId, userId, offlineCreate, onlineCreate, requireOrganization = true } = options;

  if (requireOrganization && !organizationId) {
    throw new Error('No active organization selected');
  }

  if (shouldUseOfflineNotePath(input.images) && organizationId && userId) {
    return offlineCreate(input);
  }

  const data = await onlineCreate(input);
  return { queuedOffline: false, data };
}

export function shouldUseOfflineNotePath(images: File[]): boolean {
  return !navigator.onLine || images.length === 0;
}

export type QueuedNoteToastOptions = {
  combinedOfflineMessage?: boolean;
  photoWarningMessage?: string;
};

export function showQueuedNoteCreateToasts(
  hadImages: boolean,
  options: QueuedNoteToastOptions = {},
): void {
  const copy = getRuntimeFinalHardcodedAuditExtraCopy();
  if (options.combinedOfflineMessage) {
    toast.success(hadImages ? copy.noteSavedOfflineWithPhotos : copy.noteSavedOffline);
    return;
  }

  toast.success(copy.noteSavedOffline);
  if (hadImages && options.photoWarningMessage) {
    toast.warning(options.photoWarningMessage);
  }
}

export function handleNoteCreateMutationSuccess(
  result: unknown,
  options: {
    onQueuedOffline: (hadImages: boolean) => void;
    onOnlineSuccess: () => void;
    resetForm: () => void;
  },
): void {
  const queued =
    typeof result === 'object' &&
    result !== null &&
    'queuedOffline' in result &&
    (result as QueuedNoteCreateResult).queuedOffline;

  if (queued) {
    const hadImages =
      typeof result === 'object' &&
      result !== null &&
      'hadImages' in result &&
      Boolean((result as QueuedNoteCreateResult & { hadImages?: boolean }).hadImages);
    options.onQueuedOffline(hadImages);
  } else {
    options.onOnlineSuccess();
  }

  options.resetForm();
}

export function createNoteCreateMutationCallbacks(options: {
  onQueuedOffline: (hadImages: boolean) => void;
  onOnlineSuccess: () => void;
  resetForm: () => void;
}) {
  return {
    onSuccess: (result: unknown) => handleNoteCreateMutationSuccess(result, options),
    onError: (error: unknown) => {
      logger.error('Failed to create note', error);
      toast.error(getRuntimeFinalHardcodedAuditExtraCopy().noteCreateFailed);
    },
  };
}
