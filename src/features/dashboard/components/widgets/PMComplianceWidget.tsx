import React from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEquipmentByStatus, usePMCompliance } from '@/features/dashboard/hooks/useDashboardWidgets';
import { useTeamBasedEquipment } from '@/features/teams/hooks/useTeamBasedDashboard';
import { useOrgEquipmentPMStatuses, getPMComplianceLevel } from '@/features/equipment/hooks/useEquipmentPMStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import { DonutWidgetChartSkeleton, DonutWidgetDesktopChart, DonutWidgetMobileBreakdown } from './dashboardDonutChartShared';
import { useDonutSliceNavigate, useDonutStatusChartData, useDonutStatusCountTotal, useDonutTooltipFormatter } from './useDonutStatusChartData';

const CenterLabel: React.FC<{cx:number;cy:number;pct:number;label:string}> = ({cx,cy,pct,label}) => <><text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="middle" style={{fontSize:'1.25rem',fontWeight:700,fill:'hsl(var(--foreground))'}}>{pct}%</text><text x={cx} y={cy+13} textAnchor="middle" dominantBaseline="middle" style={{fontSize:'0.65rem',fill:'hsl(var(--muted-foreground))',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</text></>;

const PMComplianceWidget: React.FC = () => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  const { data, isLoading } = usePMCompliance(organizationId);
  const { data: equipmentByStatus } = useEquipmentByStatus(organizationId);
  const { data: pmStatusesRaw } = useOrgEquipmentPMStatuses(organizationId);
  const { data: scopedEquipment } = useTeamBasedEquipment(organizationId);
  const scopedEquipmentIds = React.useMemo(() => new Set((scopedEquipment ?? []).map((item) => item.id)), [scopedEquipment]);
  const pmStatuses = React.useMemo(() => (pmStatusesRaw ?? []).filter((status) => scopedEquipmentIds.has(status.equipment_id)), [pmStatusesRaw, scopedEquipmentIds]);
  const totalCount = useDonutStatusCountTotal(data);
  const compliancePct = React.useMemo(() => { if (!data || totalCount === 0) return 0; const compliant = data.find((d) => d.status === 'completed' || d.label?.toLowerCase().includes('compli'))?.count ?? 0; return Math.round((compliant / totalCount) * 100); }, [data,totalCount]);
  const intervalSummary = React.useMemo(() => { if (!pmStatuses.length) return null; let current=0,dueSoon=0,overdue=0; for (const s of pmStatuses) { const level=getPMComplianceLevel(s); if(level==='overdue') overdue++; else if(level==='due_soon') dueSoon++; else if(level==='current') current++; } return {current,dueSoon,overdue,total:current+dueSoon+overdue}; }, [pmStatuses]);
  const totalEquipmentCount = React.useMemo(() => (equipmentByStatus ?? []).reduce((sum,item)=>sum+item.count,0), [equipmentByStatus]);
  const nonIntervalTrackedCount = Math.max((totalEquipmentCount||0)-(intervalSummary?.total||0),0);
  const chartData = useDonutStatusChartData(data, (_status, entry) => entry.color ?? 'hsl(var(--muted))');
  const handleSliceClick = useDonutSliceNavigate((status)=>status==='overdue'?'/dashboard/work-orders?date=overdue':`/dashboard/work-orders?status=${status}`);
  const tooltipContent = useDonutTooltipFormatter(totalCount,(count,percentage)=>t('dashboardWidget.workOrdersCount',{count,percentage}));

  return <Card className="h-full"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4" />{t('dashboard.widgets.pmComplianceTitle')}</CardTitle><CardDescription className="opacity-75">{t('dashboard.widgets.pmComplianceDescription')}</CardDescription></CardHeader><CardContent className="pb-4">{isLoading?<DonutWidgetChartSkeleton/>:chartData&&chartData.length>0?<div aria-label={t('dashboardWidget.pmChartLabel')}><DonutWidgetMobileBreakdown data={chartData} totalCount={totalCount} mobileTestId="pm-compliance-mobile-summary" onSliceClick={handleSliceClick} labelClassName="text-foreground" mobileSummary={<p className="text-sm text-muted-foreground">{t('dashboardWidget.pmMobileSummary',{percentage:compliancePct})}</p>}/><DonutWidgetDesktopChart data={chartData} totalCount={totalCount} tooltipContent={tooltipContent} onSliceClick={handleSliceClick} legendLabelClassName="truncate text-muted-foreground" cellStrokeDasharray={(index)=>(index%2===0?'0':'3 2')} centerLabel={<CenterLabel cx={80} cy={80} pct={compliancePct} label={t('dashboardWidget.compliant')}/>}/><p className="sr-only">{t('dashboardWidget.pmSummary',{summary:chartData.map((entry)=>`${entry.label} ${entry.count}`).join(', ')})}</p></div>:<EmptyState icon={ClipboardCheck} title={t('dashboardWidget.noPmData')} description={t('dashboardWidget.noPmDataDescription')} className="py-6"/>}
  {intervalSummary&&intervalSummary.total>0&&<div className="mt-3 border-t pt-3 space-y-1.5"><div className="mb-2 flex items-center gap-1.5"><p className="text-xs font-medium text-muted-foreground">{t('dashboardWidget.intervalTracking',{count:intervalSummary.total})}</p><TooltipProvider><Tooltip><TooltipTrigger asChild><button type="button" className="text-muted-foreground transition-colors hover:text-foreground" aria-label={t('dashboardWidget.explainIntervalTracking')}><Info className="h-3.5 w-3.5"/></button></TooltipTrigger><TooltipContent className="max-w-xs text-xs">{t('dashboardWidget.intervalTrackingHelp')}</TooltipContent></Tooltip></TooltipProvider></div><div className="flex items-center gap-2 text-xs"><CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0"/><span>{t('dashboardWidget.current')}</span><span className="ml-auto font-medium">{intervalSummary.current}</span></div>{intervalSummary.dueSoon>0&&<div className="flex items-center gap-2 text-xs"><Clock className="h-3.5 w-3.5 text-warning flex-shrink-0"/><span>{t('dashboardWidget.dueSoon')}</span><span className="ml-auto font-medium">{intervalSummary.dueSoon}</span></div>}{intervalSummary.overdue>0&&<div className="flex items-center gap-2 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5 flex-shrink-0"/><span>{t('dashboardWidget.overdue')}</span><span className="ml-auto font-medium">{intervalSummary.overdue}</span></div>}{nonIntervalTrackedCount>0&&<p className="pt-1 text-[11px] text-muted-foreground">{t('dashboardWidget.dateBasedTracking',{count:nonIntervalTrackedCount})}</p>}</div>}
  </CardContent></Card>;
};
export default PMComplianceWidget;
