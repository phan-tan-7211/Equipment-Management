import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QrCode } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import AssetQRCodePanel from '@/components/common/AssetQRCodePanel';
import { equipmentQRPath, qrFullUrl } from '@/utils/qr';
import { useI18n } from '@/i18n';



interface QRCodeOnboardingStepProps {
  equipmentId: string;
  equipmentName: string;
  onFinish: () => void;
  isFinishing?: boolean;
}

export const QRCodeOnboardingStep: React.FC<QRCodeOnboardingStepProps> = ({
  equipmentId,
  equipmentName,
  onFinish,
  isFinishing = false,
}) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const qrCodeUrl = qrFullUrl(equipmentQRPath(equipmentId, currentOrganization?.id));

  return (
    <div className="space-y-6" data-testid="onboarding-step-qr-code">
      <Alert variant="default" className="border-primary/30 bg-primary/5">
        <QrCode className="h-4 w-4" />
        <AlertTitle>{t('productOnboarding.qrTitle')}</AlertTitle>
        <AlertDescription>
          {t('productOnboarding.qrDescription')}
        </AlertDescription>
      </Alert>

      <AssetQRCodePanel
        entityId={equipmentId}
        entityName={equipmentName}
        qrCodeUrl={qrCodeUrl}
        qrImageAlt={t('productOnboarding.qrAlt', { name: equipmentName })}
        defaultFilenameStem={equipmentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}
        instructionBullets={[t('productOnboarding.qrInstructionUrl'), t('productOnboarding.qrInstructionImage'), t('productOnboarding.qrInstructionAffix'), t('productOnboarding.qrInstructionPhysical')]}
      />

      <div className="flex justify-end">
        <Button onClick={onFinish} disabled={isFinishing} data-testid="onboarding-finish-button">
          {isFinishing ? t('productOnboarding.finishing') : t('productOnboarding.finish')}
        </Button>
      </div>
    </div>
  );
};
