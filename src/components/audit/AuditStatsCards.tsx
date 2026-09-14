/**
 * AuditStatsCards — key-metrics summary for the audit log dashboard.
 * Extracted from the AuditLog page so it can live inside the customizable
 * dashboard grid as a collapsible widget (#1166).
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditStats } from '@/hooks/useAuditLog';
import { useI18n } from '@/i18n/I18nProvider';

export function AuditStatsCards({ organizationId }: { organizationId: string }) {
  const { t, language } = useI18n();
  const locale = language === 'vi' ? 'vi-VN' : language === 'ko' ? 'ko-KR' : 'en-US';
  const { data: stats, isLoading } = useAuditStats(organizationId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const createdCount = stats.byAction?.INSERT || 0;
  const updatedCount = stats.byAction?.UPDATE || 0;
  const deletedCount = stats.byAction?.DELETE || 0;

  return (
    <div className="grid gap-4 md:grid-cols-4" data-testid="audit-stats-cards">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('auditExplorer.totalEntries')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString(locale)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('auditExplorer.createdRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{createdCount.toLocaleString(locale)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('auditExplorer.updatedRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-info">{updatedCount.toLocaleString(locale)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('auditExplorer.deletedRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{deletedCount.toLocaleString(locale)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
