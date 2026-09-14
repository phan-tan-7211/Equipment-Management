import { StandardFeaturePage } from '@/components/landing/features/StandardFeaturePage';
import { useI18n } from '@/i18n';
import {
  benefits,
  capabilities,
  content,
  heroIcon,
  showcases,
  steps,
} from './data/partLookupAlternatesData';

const PartLookupAlternatesFeature = () => {
  const { t } = useI18n();
  return (
    <StandardFeaturePage
      seoPath="/features/part-lookup-alternates"
      content={{
        ...content,
        capabilitiesTitle: t('publicFeatures.partLookupAlternates.capabilitiesTitle'),
        capabilitiesDescription: t('publicFeatures.partLookupAlternates.capabilitiesDescription'),
      }}
      translationKey="partLookupAlternates"
      benefits={benefits}
      steps={steps}
      showcases={showcases}
      heroIcon={heroIcon}
      capabilities={capabilities.map((item, index) => ({
        ...item,
        name: t(`publicFeatures.partLookupAlternates.capabilities.${index}.0`),
        description: t(`publicFeatures.partLookupAlternates.capabilities.${index}.1`),
      }))}
    />
  );
};

export default PartLookupAlternatesFeature;
