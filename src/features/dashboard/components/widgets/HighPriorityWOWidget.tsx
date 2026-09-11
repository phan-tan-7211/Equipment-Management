import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeamBasedRecentWorkOrders } from '@/features/teams/hooks/useTeamBasedDashboard';
import { DashboardHighPriorityWorkOrdersCard } from '@/features/dashboard/components/DashboardHighPriorityWorkOrdersCard';
import EmptyState from '@/components/ui/empty-state';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n';

const HighPriorityWOWidget: React.FC = () => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  const { data: workOrders, isLoading } = useTeamBasedRecentWorkOrders(organizationId);
  const highPriorityWorkOrders = workOrders?.filter((wo) => wo.priority === 'high' && wo.status !== 'completed') || [];

  if (isLoading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded bg-muted" />)}</div>;
  if (highPriorityWorkOrders.length === 0) return <EmptyState icon={CheckCircle2} title={t('dashboard.allCaughtUp')} description={t('dashboard.noHighPriority')} className="py-6" />;
  return <DashboardHighPriorityWorkOrdersCard workOrders={highPriorityWorkOrders} />;
};
export default HighPriorityWOWidget;
