import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import {
  IntegrationCardHeader,
  IntegrationCardLayout,
} from '@/features/organization/components/IntegrationCardLayout';

type IntegrationNotConfiguredCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function IntegrationNotConfiguredCard({
  title,
  description,
  icon,
}: IntegrationNotConfiguredCardProps) {
  const { t } = useI18n();
  return (
    <IntegrationCardLayout>
      <IntegrationCardHeader
        title={title}
        description={description}
        icon={icon}
        badge={
          <Badge variant="secondary" className="text-xs">
            {t('organizationIntegrations.notConfigured')}
          </Badge>
        }
      />
    </IntegrationCardLayout>
  );
}
