import { StandardFeaturePage } from '@/components/landing/features/StandardFeaturePage';
import { useI18n } from '@/i18n';
import {
  benefits,
  capabilities,
  content,
  heroIcon,
  showcases,
  steps,
} from './data/inventoryManagementData';

const InventoryManagementFeature = () => {
  const { t } = useI18n();
  return (
    <StandardFeaturePage
      seoPath="/features/inventory"
      content={{
        ...content,
        capabilitiesTitle: t('publicFeatures.inventoryManagement.capabilitiesTitle'),
        capabilitiesDescription: t('publicFeatures.inventoryManagement.capabilitiesDescription'),
      }}
      translationKey="inventoryManagement"
      benefits={benefits}
      steps={steps}
      showcases={showcases}
      heroIcon={heroIcon}
      capabilities={capabilities.map((item, index) => ({
        ...item,
        name: t(`publicFeatures.inventoryManagement.capabilities.${index}.0`),
        description: t(`publicFeatures.inventoryManagement.capabilities.${index}.1`),
      }))}
    />
  );
};

export default InventoryManagementFeature;
