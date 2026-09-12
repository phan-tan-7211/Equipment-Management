import Page from '@/components/layout/Page';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Database, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function Security() {
  const { t } = useI18n();
  return (
    <Page maxWidth="4xl" padding="responsive">
      <div className="space-y-6">
        <PageBackButton />

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            {t('marketingTrust.security.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('marketingTrust.security.overview')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('marketingTrust.security.authTitle')}</CardTitle>
            <CardDescription>{t('marketingTrust.security.authDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t('marketingTrust.security.googleSignIn')}</p>
            <p>{t('marketingTrust.security.roleAccess')}</p>
            <p>{t('marketingTrust.security.noAccess')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('marketingTrust.security.dataTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t('marketingTrust.security.dataTransit')}</p>
            <p>{t('marketingTrust.security.auditLogs')}</p>
            <p>{t('marketingTrust.security.locationPrivacy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('marketingTrust.security.monitoringTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t('marketingTrust.security.securityEvents')}</p>
            <p>{t('marketingTrust.security.sessionControls')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('marketingTrust.security.disclosureTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('marketingTrust.security.disclosureText')}{' '}<a className="text-primary underline" href="mailto:security@equipqr.app">security@equipqr.app</a>.
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
