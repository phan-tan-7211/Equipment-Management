import {
  ccpaRightsPolicyItems,
  ccpaRightsSummaryItems,
  type CcpaRightPolicyItem,
  type CcpaRightSummaryItem,
} from '@/components/legal/ccpaRightsContent';
import { useI18n } from '@/i18n';

type CcpaRightsListProps =
  | { variant: 'summary' }
  | { variant: 'policy' };

const renderSummaryList = (items: CcpaRightSummaryItem[], t: (key: string) => string) => (
  <ul>
    {items.map((item, index) => (
      <li key={item.title}>
        <strong>{t(`privacyRequest.rights.${index}.title`)}</strong> {t(`privacyRequest.rights.${index}.description`)}
      </li>
    ))}
  </ul>
);

const renderPolicyList = (items: CcpaRightPolicyItem[]) => (
  <ul>
    {items.map((item) => (
      <li key={item.title}>
        <strong>{item.title}</strong> {item.description}
      </li>
    ))}
  </ul>
);

export const CcpaRightsList = (props: CcpaRightsListProps) => {
  const { t } = useI18n();
  if (props.variant === 'summary') {
    return renderSummaryList(ccpaRightsSummaryItems, t);
  }
  return renderPolicyList(ccpaRightsPolicyItems);
};
