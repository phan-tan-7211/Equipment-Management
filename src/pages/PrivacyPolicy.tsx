import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { PageSEO } from '@/components/seo/PageSEO';
import { useI18n } from '@/i18n/I18nProvider';
import { privacyPolicySectionComponents } from '@/pages/legal/privacy/privacyPolicySectionComponents';

export default function PrivacyPolicy() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageSEO
        title={t('publicLegal.privacy.seoTitle')}
        description={t('publicLegal.privacy.seoDescription')}
        path="/privacy-policy"
      />
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <PageBackButton />
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('publicLegal.privacy.title')}</h1>
          <p className="text-muted-foreground">{t('publicLegal.privacy.lastUpdated')}</p>
        </div>
      </div>

      <div className="space-y-8">
        {privacyPolicySectionComponents.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </div>
    </div>
  );
}
