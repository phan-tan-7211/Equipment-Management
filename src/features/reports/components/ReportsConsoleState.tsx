import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, ShieldX, Building2 } from 'lucide-react';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { useI18n } from '@/i18n';

interface ReportsConsoleStateProps {
  variant: 'no-organization' | 'access-restricted';
}

/**
 * Empty/restricted states styled to match the Fleet Export Console.
 */
export const ReportsConsoleState: React.FC<ReportsConsoleStateProps> = ({ variant }) => {
  const { t } = useI18n();
  const isNoOrg = variant === 'no-organization';

  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <PageHeader
          title={t('reports.consoleTitle')}
          description={
            isNoOrg
              ? t('reports.selectOrgDescription')
              : t('reports.restrictedDescription')
          }
          meta={
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wide">
              {t('reports.exportConsole')}
            </Badge>
          }
        />

        <Card className="border-border/60 texture-grain">
          <CardContent className="py-10">
            <div className="mx-auto max-w-md text-center">
              {isNoOrg ? (
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
              ) : (
                <ShieldX className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
              )}
              <h2 className="text-lg font-semibold">
                {isNoOrg ? t('reports.noOrg') : t('reports.restricted')}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isNoOrg
                  ? t('reports.chooseOrg')
                  : t('reports.restrictedHelp')}
              </p>
              {!isNoOrg && (
                <div className="mt-4 flex justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground/50" aria-hidden />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};
