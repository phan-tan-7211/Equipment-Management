import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';

interface DashboardNoTeamsCardProps {
  organizationName: string;
}

export const DashboardNoTeamsCard: React.FC<DashboardNoTeamsCardProps> = ({ organizationName }) => {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.noTeamsTitle', { name: organizationName })}</CardTitle>
        <CardDescription>
          {t('dashboard.noTeamsDescription', { name: organizationName })}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
