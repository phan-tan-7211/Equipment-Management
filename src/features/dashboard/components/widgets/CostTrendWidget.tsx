import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCostTrend } from '@/features/dashboard/hooks/useDashboardWidgets';
import { useI18n } from '@/i18n';

type Period = 'weekly' | 'monthly';
interface CostDataPoint { period: string; totalCents: number; }
function formatCurrency(cents: number): string { return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

const CostTrendWidget: React.FC = () => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  const [period, setPeriod] = useState<Period>('monthly');
  const { data: rawData, isLoading } = useCostTrend(organizationId);

  const chartData = useMemo((): CostDataPoint[] => {
    if (!rawData || rawData.length === 0) return [];
    const buckets = new Map<string, number>();
    for (const row of rawData) {
      const date = new Date(row.createdAt);
      let key: string;
      if (period === 'weekly') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = d.toISOString().slice(0, 10);
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      buckets.set(key, (buckets.get(key) ?? 0) + row.totalPriceCents);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([p, totalCents]) => ({ period: p, totalCents }));
  }, [rawData, period]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" />{t('dashboardWidget.costTrendTitle')}</CardTitle>
            <CardDescription className="text-xs">{t('dashboardWidget.costTrendDescription')}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant={period === 'weekly' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setPeriod('weekly')}>{t('dashboardWidget.week')}</Button>
            <Button variant={period === 'monthly' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setPeriod('monthly')}>{t('dashboardWidget.month')}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? <div className="space-y-2"><Skeleton className="h-40 w-full" /></div> : chartData.length > 0 ? (
          <div className="h-[180px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v: string) => period === 'monthly' ? `${v.split('-')[1]}/${v.split('-')[0].slice(2)}` : v.slice(5)} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), t('dashboardWidget.totalCost')]} contentStyle={{ backgroundColor:'hsl(var(--popover))', borderColor:'hsl(var(--border))', borderRadius:'6px', color:'hsl(var(--popover-foreground))', fontSize:'12px' }} />
            <Line type="monotone" dataKey="totalCents" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill:'hsl(var(--primary))', r:3 }} activeDot={{ r:5 }} />
          </LineChart></ResponsiveContainer></div>
        ) : <EmptyState icon={DollarSign} title={t('dashboardWidget.noCostData')} description={t('dashboardWidget.noCostDataDescription')} className="py-6" />}
      </CardContent>
    </Card>
  );
};
export default CostTrendWidget;
