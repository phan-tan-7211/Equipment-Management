import { translateDsrCode } from '@/i18n/dsrResources';
import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DsrRequest } from '@/features/dsr/api/dsrApi';

interface DsrQueueRailProps {
  requests: DsrRequest[];
  selectedRequestId?: string;
}

function getBadgeVariant(slaBucket?: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (slaBucket === 'overdue') return 'destructive';
  if (slaBucket === 'due_soon') return 'secondary';
  return 'outline';
}

export function DsrQueueRail({ requests, selectedRequestId }: DsrQueueRailProps) {
  const { t } = useI18n();
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('dsr.queue')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Link
              to="/do-not-sell-or-share"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('dsr.noActiveRequests')}
            </Link>
          </p>
        )}
        {requests.map((request) => {
          const isSelected = request.id === selectedRequestId;
          const dueDate = request.extended_due_at ?? request.due_at;
          return (
            <Link
              key={request.id}
              to={`/dashboard/dsr/${request.id}`}
              className={`block rounded-md border p-3 transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{request.requester_email}</span>
                <Badge variant={getBadgeVariant(request.sla_bucket)}>{translateDsrCode(t, 'sla', request.sla_bucket ?? 'on_track')}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <div>{t('dsr.type')}: {translateDsrCode(t, 'requestTypes', request.request_type)}</div>
                <div>{t('dsr.status')}: {translateDsrCode(t, 'statuses', request.status)}</div>
                <div>{t('dsr.due', { date: new Date(dueDate).toLocaleDateString() })}</div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
