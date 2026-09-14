/**
 * AuditTimelineHistogram — Recharts stacked-bar visualization of audit-event
 * volume over time, color-coded by action severity (issue #641). Click a bar
 * to narrow the explorer to that bucket's range.
 */

import React, { useMemo } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS, ko as koLocale, vi as viLocale } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nProvider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ACTION_SEVERITY_COLOR,
  AUDIT_ACTIONS,
  AuditAction,
  AuditLogTimelineBucket,
  AuditLogTimelineRow,
} from '@/types/audit';
import { aggregateByBucket, BUCKET_LABEL_FORMAT } from './aggregate-bucket';

function readBucketIsoFromBarClick(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const o = payload as Record<string, unknown>;
  if (typeof o.bucket === 'string') return o.bucket;
  const inner = o.payload;
  if (inner && typeof inner === 'object' && 'bucket' in inner) {
    const b = (inner as { bucket: unknown }).bucket;
    if (typeof b === 'string') return b;
  }
  return undefined;
}

export interface AuditTimelineHistogramProps {
  data: AuditLogTimelineRow[];
  bucket: AuditLogTimelineBucket;
  /** Range start (ISO). When both range bounds are provided, the chart pre-seeds zero buckets across the full range. */
  dateFrom?: string;
  /** Range end (ISO, exclusive). */
  dateTo?: string;
  isLoading?: boolean;
  onBucketClick?: (bucketIso: string) => void;
  height?: number;
}

export function AuditTimelineHistogram({
  data,
  bucket,
  dateFrom,
  dateTo,
  isLoading = false,
  onBucketClick,
  height = 96,
}: AuditTimelineHistogramProps) {
  const { t, language } = useI18n();
  const chartData = useMemo(
    () => aggregateByBucket(data, bucket, dateFrom, dateTo).map((row) => ({
      ...row,
      bucketLabel: formatInTimeZone(new Date(row.bucket), 'UTC', BUCKET_LABEL_FORMAT[bucket], {
        locale: language === 'vi' ? viLocale : language === 'ko' ? koLocale : enUS,
      }),
    })),
    [data, bucket, dateFrom, dateTo, language]
  );

  if (isLoading) {
    return (
      <div
        style={{ height }}
        className="flex items-end gap-px px-3 py-2"
        data-testid="audit-timeline-skeleton"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${20 + ((i * 17) % 60)}%` }}
          />
        ))}
      </div>
    );
  }

  if (!chartData.length) {
    // Keep empty UI within `height` — the shared EmptyState uses py-12 + large
    // title/description and overflows this short slot, painting over the toolbar
    // above (overflow: visible). Compact copy only; no full-page empty pattern.
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-0.5 overflow-hidden px-3 text-center"
        data-testid="audit-timeline-empty"
      >
        <Activity
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="text-[11px] font-medium leading-tight text-muted-foreground">
          {t('auditExplorer.noActivity')}
        </p>
        <p className="text-[10px] leading-tight text-muted-foreground/80">
          {t('auditExplorer.widenRange')}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height }} data-testid="audit-timeline-histogram">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 6, right: 12, left: 8, bottom: 4 }}
        >
          <XAxis
            dataKey="bucketLabel"
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            formatter={(value, name) => [value, t(`auditLogControls.${String(name)}`)]}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              fontSize: 11,
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {(Object.values(AUDIT_ACTIONS) as AuditAction[]).map((action) => (
            <Bar
              key={action}
              dataKey={action}
              stackId="actions"
              fill={ACTION_SEVERITY_COLOR[action]}
              cursor={onBucketClick ? 'pointer' : 'default'}
              onClick={(payload: unknown) => {
                if (!onBucketClick) return;
                const bucketIso = readBucketIsoFromBarClick(payload);
                if (bucketIso) onBucketClick(bucketIso);
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
