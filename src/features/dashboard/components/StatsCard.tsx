import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatStatsCardSparklineDescription } from '@/features/dashboard/components/statsCardSparklineA11y';
import { useI18n } from '@/i18n';

function useCountUp(target: number, durationMs = 300): number {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? target : 0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (prefersReducedMotion) { setDisplayed(target); return; }
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs, prefersReducedMotion]);
  return displayed;
}

interface TrendData { direction: 'up' | 'down' | 'flat'; delta: number; }
interface StatsCardProps { icon: ReactNode; label: string; value: number | string; sublabel?: string; to?: string; trend?: TrendData; trendNote?: string; sparkline?: number[]; variant?: 'default' | 'warning' | 'danger'; loading?: boolean; ariaDescription?: string; }
const variantStyles = {
  default: { border:'border-l-primary', text:'text-info', iconSurface:'border-info/20 bg-info/10', chartColor:'hsl(var(--info))' },
  warning: { border:'border-l-warning', text:'text-warning', iconSurface:'border-warning/20 bg-warning/10', chartColor:'hsl(var(--warning))' },
  danger: { border:'border-l-destructive', text:'text-destructive', iconSurface:'border-destructive/20 bg-destructive/10', chartColor:'hsl(var(--destructive))' },
};
const StatsCardSparkline = React.lazy(() => import('./StatsCardSparkline'));

export const StatsCard: React.FC<StatsCardProps> = ({ icon,label,value,sublabel,to,trend,trendNote,sparkline,variant='default',loading=false,ariaDescription }) => {
  const { t } = useI18n();
  const styles = variantStyles[variant];
  const numericValue = typeof value === 'number' ? value : 0;
  const animatedValue = useCountUp(loading ? 0 : numericValue, 300);
  const displayValue = typeof value === 'number' ? animatedValue : value;
  const uid = useId();
  const gradientId = `sparkline-${uid.replace(/:/g, '')}`;
  const hasSparkline = sparkline && sparkline.length > 1;
  const sparklineDescription = hasSparkline ? formatStatsCardSparklineDescription(label, sparkline, trend, trendNote) : null;
  const content = <Card className={cn("overflow-hidden border-l-[3px] bg-card/95 transition-all duration-200",styles.border,variant==='warning'&&'bg-warning/5 dark:bg-warning/10',variant==='danger'&&'bg-destructive/5 dark:bg-destructive/10',to&&"cursor-pointer hover:border-primary/35 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]")} aria-label={ariaDescription}>
    <CardContent className={cn("p-4 pt-4 sm:p-5 sm:pt-5",hasSparkline?"pb-3 sm:pb-3":"pb-5 sm:pb-6")}>
      {loading ? <div className="space-y-3"><div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded"/><Skeleton className="h-3 w-24"/></div><Skeleton className="h-9 w-16"/><Skeleton className="h-3 w-20"/></div> : <>
        <div className="flex items-center gap-2.5 mb-2"><span className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border",styles.text,styles.iconSurface)}>{icon}</span><span className="text-[13px] font-semibold text-muted-foreground tracking-wide truncate">{label}</span></div>
        <div className="font-tabular text-3xl font-bold tracking-tight text-foreground" data-testid={`${label.toLowerCase().replace(/\s+/g,'-')}-value`}>{displayValue}</div>
        <p className={cn("mt-1 text-[13px] text-muted-foreground min-h-[1.25rem]",!sublabel&&"invisible")}>{sublabel??'\u00A0'}</p>
        {trend && <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium",trend.direction==='up'&&"text-success",trend.direction==='down'&&"text-destructive",trend.direction==='flat'&&"text-muted-foreground")}>{trend.direction==='up'&&<TrendingUp className="h-3 w-3" aria-hidden/>}{trend.direction==='down'&&<TrendingDown className="h-3 w-3" aria-hidden/>}{trend.direction==='flat'&&<Minus className="h-3 w-3" aria-hidden/>}{trend.delta}% {t('dashboardWidget.thisWeek')}</div>}
        {trendNote&&<div className="mt-1.5 text-xs text-muted-foreground">{trendNote}</div>}
        {hasSparkline&&<><p className="sr-only">{sparklineDescription}</p><React.Suspense fallback={<div aria-hidden className="mt-2 h-10 w-full min-w-[4rem]"><Skeleton className="h-10 w-full"/></div>}><StatsCardSparkline data={sparkline!} color={styles.chartColor} gradientId={gradientId}/></React.Suspense></>}
      </>}
    </CardContent>
  </Card>;
  if (to && !loading) return <Link to={to} className="cursor-pointer block">{content}</Link>;
  return content;
};
