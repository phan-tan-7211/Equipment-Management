import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AssetQRCodeDisplay from '@/components/common/AssetQRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { qrFullUrl, quickFormQRPath } from '@/utils/qr';
import { getQuickFormToken } from '@/features/quick-forms/services/quickFormsService';
import type { QuickForm } from '@/features/quick-forms/services/quickFormsService';
import { logger } from '@/utils/logger';


export interface QuickFormQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: QuickForm | null;
  onRotateToken: (formId: string) => Promise<string>;
  isRotating: boolean;
}

/** QR link dialog for one quick form: shared asset QR layout, rotate control, and public-use instructions. */
export function QuickFormQrDialog({
  open,
  onOpenChange,
  form,
  onRotateToken,
  isRotating,
}: QuickFormQrDialogProps) {
  const { t } = useI18n();
  const qrInstructions = [1, 2, 3, 4].map((number) => t(`quickForms.qr.instruction${number}`));
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [rotateInFlight, setRotateInFlight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadToken() {
      if (!open || !form) return;
      setLoading(true);
      setPublicUrl(null);
      try {
        const rawToken = await getQuickFormToken(form.id, form.organization_id);
        if (cancelled) return;
        if (!rawToken) {
          setPublicUrl(null);
          return;
        }
        setPublicUrl(qrFullUrl(quickFormQRPath(rawToken)));
      } catch (error) {
        logger.error('Failed to load quick form token', error);
        if (!cancelled) toast.error(t('quickForms.qr.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadToken();
    return () => {
      cancelled = true;
    };
  }, [open, form, t]);

  const dismissGuardActive = confirmRotate || isRotating || rotateInFlight;

  const handleClose = () => {
    if (dismissGuardActive) return;
    onOpenChange(false);
  };

  const handleRotate = async () => {
    if (!form) return;
    setRotateInFlight(true);
    try {
      const rawToken = await onRotateToken(form.id);
      setPublicUrl(qrFullUrl(quickFormQRPath(rawToken)));
      toast.success(t('quickForms.qr.rotated'));
    } catch (error) {
      logger.error('Failed to rotate quick form token', error);
      toast.error(t('quickForms.qr.rotateFailed'));
    } finally {
      setConfirmRotate(false);
      setRotateInFlight(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('quickForms.qr.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('quickForms.qr.loading', { name: form?.name ?? t('quickForms.qr.resource') })}
            </DialogDescription>
          </DialogHeader>
          <Skeleton className="mx-auto h-56 w-56" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!publicUrl) {
    return (
      <>
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
          <DialogContent
            className="max-w-md"
            onInteractOutside={(event) => {
              if (dismissGuardActive) event.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>{t('quickForms.qr.title')}</DialogTitle>
              <DialogDescription>
                {t('quickForms.qr.unavailable', { name: form?.name ?? t('quickForms.qr.resource') })}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center px-4">
              {t('quickForms.qr.generateHint')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mx-auto"
              onClick={() => setConfirmRotate(true)}
              disabled={isRotating || rotateInFlight || !form}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRotating || rotateInFlight ? t('quickForms.qr.rotating') : t('quickForms.qr.generate')}
            </Button>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmRotate} onOpenChange={setConfirmRotate}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('quickForms.qr.generateTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('quickForms.qr.generateDescription', { name: form?.name ?? t('quickForms.qr.resource') })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('quickForms.page.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleRotate()}>
                {t('quickForms.qr.generateAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <AssetQRCodeDisplay
        open={open}
        onClose={handleClose}
        entityId={form?.id ?? 'quick-form'}
        entityName={form?.name}
        title={t('quickForms.qr.title')}
        resourceLabel={t('quickForms.qr.resource')}
        qrCodeUrl={publicUrl}
        qrImageAlt={t('quickForms.qr.alt', { name: form?.name ?? t('quickForms.qr.resource') })}
        defaultFilenameStem={form?.name?.replace(/\s+/g, '-') ?? 'quick-form'}
        instructionBullets={qrInstructions}
        qrImageTestId="quick-form-qr-image"
        urlTestId="quick-form-public-url"
        preventClose={dismissGuardActive}
        onInteractOutside={(event) => {
          if (dismissGuardActive) event.preventDefault();
        }}
        headerExtra={
          form?.description ? (
            <p className="text-sm text-muted-foreground pb-2">{form.description}</p>
          ) : undefined
        }
        footerExtra={
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setConfirmRotate(true)}
            disabled={isRotating || rotateInFlight || !form}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRotating || rotateInFlight ? t('quickForms.qr.rotating') : t('quickForms.qr.rotate')}
          </Button>
        }
      />

      <AlertDialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('quickForms.qr.rotateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('quickForms.qr.rotateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('quickForms.page.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRotate()}>
              {t('quickForms.qr.rotateAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
