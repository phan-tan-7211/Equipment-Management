import { StandardFeaturePage } from '@/components/landing/features/StandardFeaturePage';
import { benefits, content, heroIcon, showcases, steps } from './data/workOrderManagementData';

const WorkOrderManagementFeature = () => (
  <StandardFeaturePage
    seoPath="/features/work-order-management"
    content={content}
    translationKey="workOrderManagement"
    benefits={benefits}
    steps={steps}
    showcases={showcases}
    heroIcon={heroIcon}
  />
);

export default WorkOrderManagementFeature;
