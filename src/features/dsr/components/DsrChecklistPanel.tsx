import { translateDsrCode } from '@/i18n/dsrResources';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DsrRequest } from '@/features/dsr/api/dsrApi';

interface DsrChecklistPanelProps {
  request: DsrRequest;
}

export function DsrChecklistPanel({ request }: DsrChecklistPanelProps) {
  const { t } = useI18n();
  const requiredSteps = request.required_checklist_steps ?? [];
  const progress = (request.checklist_progress ?? {}) as Record<string, { completed_at?: string; actor_email?: string }>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('dsr.checklist')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requiredSteps.map((step) => {
          const info = progress[step];
          const done = Boolean(info?.completed_at);
          return (
            <div key={step} className="rounded-md border p-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{translateDsrCode(t, 'checklistSteps', step)}</p>
                <span className={`text-xs ${done ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {done ? t('dsr.completed') : t('dsr.pending')}
                </span>
              </div>
              {done && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dsr.completedByAt', { actor: info?.actor_email ?? t('dsr.admin'), date: new Date(info?.completed_at as string).toLocaleString() })}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
