import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AssetQRCodePanel from '@/components/common/AssetQRCodePanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import { qrFullUrl, workOrderQRPath } from '@/utils/qr';
import { ClipboardList, Loader2 } from 'lucide-react';

interface WorkOrderQRCodeDisplayProps {
  open: boolean;
  onClose: () => void;
  workOrderId: string;
  workOrderTitle?: string;
  onPrintFieldWorksheet: () => void;
  isPrintingWorksheet?: boolean;
  /** Internal-only printable worksheet; hidden for customer-safe export audience. */
  showFieldWorksheet?: boolean;
}

const WorkOrderQRCodeDisplay: React.FC<WorkOrderQRCodeDisplayProps> = ({
  open,
  onClose,
  workOrderId,
  workOrderTitle,
  onPrintFieldWorksheet,
  isPrintingWorksheet = false,
  showFieldWorksheet = false,
}) => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const instructionBullets = showFieldWorksheet
    ? [1, 2, 3, 4].map((n) => t(`workOrderQR.worksheetInstruction${n}`))
    : [1, 2].map((n) => t(`workOrderQR.qrInstruction${n}`));
  const qrCodeUrl = qrFullUrl(workOrderQRPath(workOrderId));
  const filenameStem = workOrderTitle
    ? workOrderTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : `work-order-${workOrderId}`;

  return (
    <Dialog open={open} onOpenChange={(dialogOpen) => !dialogOpen && onClose()}>
      <DialogContent className={`max-w-md ${isMobile ? 'max-h-[calc(100dvh-2rem)] overflow-y-auto p-4' : ''}`}>
        <DialogHeader>
          <DialogTitle>{t('workOrderQR.title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('workOrderQR.description', { name: workOrderTitle || workOrderId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AssetQRCodePanel
            entityId={workOrderId}
            entityName={workOrderTitle}
            qrCodeUrl={qrCodeUrl}
            qrImageAlt={t('workOrderQR.imageAlt')}
            defaultFilenameStem={filenameStem}
            instructionBullets={instructionBullets}
            imageLoading="lazy"
          />

          {showFieldWorksheet ? (
            <>
              <Separator />

              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t('workOrderQR.worksheetTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('workOrderQR.worksheetDescription')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full min-h-11"
                  onClick={onPrintFieldWorksheet}
                  disabled={isPrintingWorksheet}
                >
                  {isPrintingWorksheet ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ClipboardList className="h-4 w-4" aria-hidden />
                  )}
                  {t('workOrderQR.printWorksheet')}
                </Button>
              </div>
            </>
          ) : null}

          <Button type="button" variant="outline" className="w-full min-h-11" onClick={onClose}>
            {t('workOrderQR.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderQRCodeDisplay;
