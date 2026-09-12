import { translateDsrCode } from '@/i18n/dsrResources';
import { useI18n } from '@/i18n';
import { useMemo } from 'react';
import { toast } from 'sonner';
import type { DsrRequest, DsrRequestEvent } from '@/features/dsr/api/dsrApi';
import { DsrChecklistPanel } from '@/features/dsr/components/DsrChecklistPanel';
import { DsrEvidencePanel } from '@/features/dsr/components/DsrEvidencePanel';
import { DsrLifecycleActions } from '@/features/dsr/components/DsrLifecycleActions';

interface DsrCaseWorkspaceProps {
  request: DsrRequest;
  events: DsrRequestEvent[];
  canManageDsr: boolean;
  pending: boolean;
  onMutate: (
    action:
      | 'verify'
      | 'deny'
      | 'extend'
      | 'record_fulfillment_step'
      | 'fulfill_deletion'
      | 'complete'
      | 'add_note'
      | 'request_export'
      | 'retry_export'
      | 'resend_notice',
    payload?: Record<string, unknown>,
  ) => Promise<void>;
}

export function DsrCaseWorkspace({ request, events, canManageDsr, pending, onMutate }: DsrCaseWorkspaceProps) {
  const { t } = useI18n();
  const timeline = useMemo(
    () => [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events],
  );

  const runMutation = async (
    action:
      | 'verify'
      | 'deny'
      | 'extend'
      | 'record_fulfillment_step'
      | 'fulfill_deletion'
      | 'complete'
      | 'add_note'
      | 'request_export'
      | 'retry_export'
      | 'resend_notice',
    payload?: Record<string, unknown>,
  ) => {
    if (!canManageDsr) {
      toast.error(t('dsr.manageDenied'));
      return;
    }

    try {
      await onMutate(action, payload);
      toast.success(t('dsr.actionApplied', { action: translateDsrCode(t, 'actions', action) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('dsr.actionFailed');
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <h2 className="text-lg font-semibold">{t('dsr.caseDetails')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('dsr.requester', { email: request.requester_email })}</p>
        <p className="text-sm text-muted-foreground">{t('dsr.type')}: {translateDsrCode(t, 'requestTypes', request.request_type)}</p>
        <p className="text-sm text-muted-foreground">{t('dsr.status')}: {translateDsrCode(t, 'statuses', request.status)}</p>
      </div>

      <DsrLifecycleActions
        canManageDsr={canManageDsr}
        canVerify={request.status === 'received' || request.status === 'verifying'}
        isProcessing={request.status === 'processing'}
        onVerify={(verificationMethod) => runMutation('verify', { verificationMethod })}
        onComplete={() => runMutation('complete')}
        onDeny={(reason) => runMutation('deny', { reason })}
        onExtend={(reason) => runMutation('extend', { reason })}
      />

      <DsrChecklistPanel request={request} />

      <DsrEvidencePanel
        canManageDsr={canManageDsr}
        exportArtifacts={request.export_artifacts}
        onGenerate={() => runMutation('request_export')}
        onRetry={() => runMutation('retry_export')}
        disabled={pending}
      />

      <div className="rounded-md border p-3">
        <h3 className="text-sm font-medium mb-2">{t('dsr.timeline')}</h3>
        <div className="space-y-2">
          {timeline.length === 0 ? <p className="text-sm text-muted-foreground">{t('dsr.noEvents')}</p> : null}
          {timeline.map((event) => (
            <div key={event.id} className="rounded-sm border p-2">
              <p className="text-sm font-medium">{event.summary}</p>
              <p className="text-xs text-muted-foreground">
                {translateDsrCode(t, 'eventTypes', event.event_type)} • {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
