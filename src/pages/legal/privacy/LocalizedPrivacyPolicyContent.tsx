import type { JSX } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { LegalPolicySection } from '@/components/legal/LegalPolicySection';
import { privacyPolicyContentResources } from '@/i18n/privacyPolicyContentResources';

export function LocalizedPrivacyPolicyContent(): JSX.Element {
  const { language } = useI18n();
  const sections =
    language === 'vi'
      ? privacyPolicyContentResources.vi.privacyPolicyContent
      : privacyPolicyContentResources.ko.privacyPolicyContent;

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <LegalPolicySection key={section.title} title={section.title}>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          ) : null}
        </LegalPolicySection>
      ))}
    </div>
  );
}
