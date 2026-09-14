import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, Cloud, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

export interface ReportsStatusStripProps {
  organizationName: string;
  canExport: boolean;
  isGoogleWorkspaceConnected: boolean;
  className?: string;
}

/**
 * Compact mission-control status strip for the Fleet Export Console.
 */
export const ReportsStatusStrip: React.FC<ReportsStatusStripProps> = ({
  organizationName,
  canExport,
  isGoogleWorkspaceConnected,
  className,
}) => {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border border-border/60 bg-card/80 p-3 sm:p-4 texture-grain',
        className,
      )}
      aria-label={t('reports.consoleStatus')}
    >
      <StatusItem
        icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
        label={t('reports.organization')}
        value={organizationName}
      />
      <StatusItem
        icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}
        label={t('reports.exportAccess')}
        value={
          canExport ? (
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
              {t('reports.ownerAdmin')}
            </Badge>
          ) : (
            <span className="text-muted-foreground">{t('reports.restricted')}</span>
          )
        }
      />
      <StatusItem
        icon={<Cloud className="h-3.5 w-3.5" aria-hidden />}
        label={t('reports.googleWorkspace')}
        value={
          isGoogleWorkspaceConnected ? (
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide text-success">
              {t('reports.connected')}
            </Badge>
          ) : (
            <span className="text-muted-foreground">{t('reports.notConnected')}</span>
          )
        }
      />
      <StatusItem
        icon={<Gauge className="h-3.5 w-3.5" aria-hidden />}
        label={t('reports.rateLimit')}
        value={
          <span className="font-tabular text-xs text-muted-foreground">
            {t('reports.rateLimitSummary')}
          </span>
        }
      />
    </div>
  );
};

interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, label, value }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="truncate text-sm font-medium">{value}</div>
  </div>
);
