import { useI18n } from '@/i18n';

import React from 'react';
import AssetQRCodeDisplay from '@/components/common/AssetQRCodeDisplay';
import { inventoryQRPath, qrFullUrl } from '@/utils/qr';

interface InventoryQRCodeDisplayProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemName?: string;
}


const InventoryQRCodeDisplay: React.FC<InventoryQRCodeDisplayProps> = ({
  open,
  onClose,
  itemId,
  itemName,
}) => {
  const { t } = useI18n();
  const qrCodeUrl = qrFullUrl(inventoryQRPath(itemId));

  return (
    <AssetQRCodeDisplay
      open={open}
      onClose={onClose}
      entityId={itemId}
      entityName={itemName}
      title={t('inventoryListAux.qrTitle')}
      resourceLabel={t('inventoryListAux.qrResource')}
      qrCodeUrl={qrCodeUrl}
      qrImageAlt={t('inventoryListAux.qrTitle')}
      defaultFilenameStem={`inventory-${itemId}`}
      instructionBullets={[t('inventoryListAux.qrPrint'), t('inventoryListAux.qrScan'), t('inventoryListAux.qrRedirect'), t('inventoryListAux.qrHistory')]}
    />
  );
};

export default InventoryQRCodeDisplay;
