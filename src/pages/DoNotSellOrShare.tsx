import { Link } from 'react-router-dom';
import { PageBackButton } from '@/components/layout/PageBackButton';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/seo/PageSEO';
import { useI18n } from '@/i18n/I18nProvider';

const CONTACT_EMAIL = 'mailto:phantan7211@gmail.com';

export default function DoNotSellOrShare() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title={t('publicLegal.doNotSell.seoTitle')}
        description={t('publicLegal.doNotSell.seoDescription')}
        path="/do-not-sell-or-share"
      />
      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <PageBackButton />
          <LanguageSwitcher />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('publicLegal.doNotSell.title')}</CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              {t('publicLegal.doNotSell.effectiveDate')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert space-y-4">
            <p>
              {t('publicLegal.doNotSell.operatedBy')} <strong>ZNT LLC</strong>.{' '}
              {t('publicLegal.doNotSell.noSell')}
            </p>
            <p>{t('publicLegal.doNotSell.rights')}</p>
            <p>
              <Button asChild>
                <Link to="/privacy-request">{t('publicLegal.doNotSell.submit')}</Link>
              </Button>
            </p>
            <p>
              {t('publicLegal.doNotSell.questions')}{' '}
              <a href={CONTACT_EMAIL} className="underline">
                phantan7211@gmail.com
              </a>
              .
            </p>
            <p>
              {t('publicLegal.doNotSell.seeAlso')}{' '}
              <Link to="/privacy-policy" className="underline">
                {t('publicLegal.doNotSell.privacyPolicy')}
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
