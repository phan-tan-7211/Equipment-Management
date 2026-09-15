import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/I18nProvider';

const PRIVACY_SECTION_TITLE_KEYS: Record<string, string> = {
  '1. Introduction': 's1',
  '2. Information We Collect — Individual User Level (Notice at Collection)': 's2',
  '3. Information We Collect — Organization Level': 's3',
  '4. External Service Providers (Subprocessors)': 's4',
  '5. Cookies, Local Storage, and Session Data': 's5',
  '6. How We Use Your Information': 's6',
  '7. How We Share Your Information': 's7',
  '8. Data Security': 's8',
  '9. Data Retention, Export, and Deletion': 's9',
  '10. Your Rights and Choices': 's10',
  '10A. Your California Privacy Rights (CCPA/CPRA)': 's10a',
  "11. Children's Privacy": 's11',
  '12. International Data Transfers': 's12',
  '13. Changes to This Privacy Policy': 's13',
  '14. Contact Us': 's14',
};

interface LegalPolicySectionProps {
  title: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Shared Card shell for legal policy pages (wording lives in children). */
export const LegalPolicySection = ({ title, id, className, children }: LegalPolicySectionProps) => {
  const { t } = useI18n();
  const titleKey = PRIVACY_SECTION_TITLE_KEYS[title];
  const localizedTitle = titleKey
    ? t(`publicLegal.privacy.sectionTitles.${titleKey}`)
    : title;

  return (
    <Card id={id} className={className}>
      <CardHeader>
        <CardTitle>{localizedTitle}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none dark:prose-invert">{children}</CardContent>
    </Card>
  );
};
