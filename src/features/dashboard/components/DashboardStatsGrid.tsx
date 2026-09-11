import React from 'react';
import { Forklift, Wrench, ClipboardList, AlertTriangle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import type { DashboardTrends, StatTrend } from '@/features/dashboard/services/dashboardWidgetService';
import { useI18n } from '@/i18n';

interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  maintenanceEquipment?: number;
  inactiveEquipment?: number;
  totalWorkOrders: number;
  overdueWorkOrders: number;
}

interface DashboardStatsGridProps {
  stats: DashboardStats | null | undefined;
  activeWorkOrdersCount: number;
  needsAttentionCount: number;
  isLoading?: boolean;
  trends?: DashboardTrends | null;
}

type CardTrendProps = {
  sparkline: number[] | undefined;
  trend:
    | {
        direction: 'up' | 'down' | 'flat';
        delta: number;
      }
    | undefined;
  trendNote: string | undefined;
};

function toCardProps(
  trend: StatTrend | undefined,
  options?: { invertDirection?: boolean }
): CardTrendProps {
  if (!trend) return { sparkline: undefined, trend: undefined, trendNote: undefined };

  const hasSeries = trend.sparkline.length > 1;
  const hasDelta = trend.delta !== null && trend.delta !== undefined;
  const invertDirection = options?.invertDirection === true;
  const direction =
    invertDirection && trend.direction !== 'flat'
      ? trend.direction === 'up'
        ? 'down'
        : 'up'
      : trend.direction;

  return {
    sparkline: hasSeries ? trend.sparkline : undefined,
    trend: hasDelta ? { direction, delta: Math.abs(trend.delta) } : undefined,
    trendNote: undefined,
  };
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  activeWorkOrdersCount,
  needsAttentionCount,
  isLoading = false,
  trends,
}) => {
  const { t } = useI18n();
  const overdueCount = stats?.overdueWorkOrders ?? 0;
  const totalEquipment = stats?.totalEquipment ?? 0;
  const totalWorkOrders = stats?.totalWorkOrders ?? 0;

  const teProps = toCardProps(trends?.totalEquipment);
  const owProps = toCardProps(trends?.overdueWorkOrders, { invertDirection: true });
  const twoProps = toCardProps(trends?.totalWorkOrders);
  const naProps = toCardProps(trends?.needsAttention, { invertDirection: true });

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <StatsCard
        icon={<Forklift className="h-4 w-4" />}
        label={t('dashboard.totalEquipment')}
        value={totalEquipment}
        sublabel={t('dashboard.activeCount', { count: stats?.activeEquipment ?? 0 })}
        to={isLoading ? undefined : '/dashboard/equipment'}
        ariaDescription={t('dashboard.viewAllEquipment')}
        loading={isLoading}
        sparkline={teProps.sparkline}
        trend={teProps.trend}
        trendNote={teProps.trendNote}
      />

      <StatsCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label={t('dashboard.overdueWork')}
        value={overdueCount}
        sublabel={t('dashboard.overdueWorkHint')}
        to={isLoading ? undefined : '/dashboard/work-orders?date=overdue'}
        ariaDescription={t('dashboard.viewOverdueWorkOrders')}
        variant={overdueCount > 0 ? 'danger' : 'default'}
        loading={isLoading}
        sparkline={owProps.sparkline}
        trend={owProps.trend}
        trendNote={owProps.trendNote}
      />

      <StatsCard
        icon={<ClipboardList className="h-4 w-4" />}
        label={t('dashboard.totalWorkOrders')}
        value={totalWorkOrders}
        sublabel={t('dashboard.activeCount', { count: activeWorkOrdersCount })}
        to={isLoading ? undefined : '/dashboard/work-orders'}
        ariaDescription={t('dashboard.viewAllWorkOrders')}
        loading={isLoading}
        sparkline={twoProps.sparkline}
        trend={twoProps.trend}
        trendNote={twoProps.trendNote}
      />

      <StatsCard
        icon={<Wrench className="h-4 w-4" />}
        label={t('dashboard.needsAttention')}
        value={needsAttentionCount}
        sublabel={t('dashboard.maintenanceOrInactive')}
        to={isLoading ? undefined : '/dashboard/equipment?status=out_of_service'}
        ariaDescription={t('dashboard.viewNeedsAttentionEquipment')}
        variant={needsAttentionCount > 0 ? 'warning' : 'default'}
        loading={isLoading}
        sparkline={naProps.sparkline}
        trend={naProps.trend}
        trendNote={naProps.trendNote}
      />
    </div>
  );
};
