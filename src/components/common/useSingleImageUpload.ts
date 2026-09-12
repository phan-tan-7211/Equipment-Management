import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { finishDragDrop, handleDragActiveState } from '@/components/common/drag-active-handlers';
import { useAppToast } from '@/hooks/useAppToast';
import { sanitizeBlobUrl } from '@/utils/sanitizeBlobUrl';
import { useI18n } from '@/i18n';
import {
  formatAcceptedTypesLabel,
  resolveImageUploadSession,
  validateImageFile,
} from '@/components/common/singleImageUploadSession';

type UseSingleImageUploadArgs = {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  maxSizeMB: number;
  acceptedTypes: string[];
  disabled: boolean;
};

export function useSingleImageUpload({
  currentImageUrl,
  onUpload,
  onDelete,
  maxSizeMB,
  acceptedTypes,
  disabled,
}: UseSingleImageUploadArgs) {
  const { t } = useI18n();
  const appToast = useAppToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isProcessing = isUploading || isDeleting;

  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!previewFile) {
      setRawPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setRawPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  const previewUrl = useMemo(() => sanitizeBlobUrl(rawPreviewUrl), [rawPreviewUrl]);
  const formatLabel = useMemo(() => formatAcceptedTypesLabel(acceptedTypes), [acceptedTypes]);
  const session = resolveImageUploadSession(currentImageUrl, imageError, previewFile, previewUrl);

  const handleFileSelect = (file: File) => {
    const result = validateImageFile(file, acceptedTypes, maxSizeMB);
    if (result.ok === false) {
      appToast.error({ description: !acceptedTypes.includes(file.type)
        ? t('sharedUi.unsupportedSingleImage', { name: file.name, formats: formatLabel })
        : t('sharedUi.singleImageTooLarge', { name: file.name, size: maxSizeMB }) });
      return;
    }
    setPreviewFile(file);
    setImageError(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (event: DragEvent) => {
    handleDragActiveState(event, setDragActive);
  };

  const handleDrop = (event: DragEvent) => {
    finishDragDrop(event, setDragActive);
    if (disabled || isProcessing) return;
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!previewFile) return;
    setIsUploading(true);
    try {
      await onUpload(previewFile);
      setPreviewFile(null);
      appToast.success({ description: t('sharedUi.singleUploadSuccess') });
    } catch (error) {
      appToast.error({
        description: t('sharedUi.singleUploadFailed', { error: error instanceof Error ? error.message : t('sharedUi.unknownError') }),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      appToast.success({ description: t('sharedUi.singleRemoveSuccess') });
    } catch (error) {
      appToast.error({
        description: t('sharedUi.singleRemoveFailed', { error: error instanceof Error ? error.message : t('sharedUi.unknownError') }),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    session,
    inputId,
    fileInputRef,
    isUploading,
    isDeleting,
    isProcessing,
    dragActive,
    formatLabel,
    handleInputChange,
    handleDrag,
    handleDrop,
    handlePickFile: () => fileInputRef.current?.click(),
    handleUpload: () => {
      void handleUpload();
    },
    handleCancelPreview: () => {
      setPreviewFile(null);
      setImageError(false);
    },
    handleDelete: onDelete
      ? () => {
          void handleDelete();
        }
      : undefined,
    handleImageError: () => setImageError(true),
  };
}
