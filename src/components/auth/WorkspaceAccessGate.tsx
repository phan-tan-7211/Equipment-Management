import React from 'react';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORT_DOCS_URL } from '@/lib/documentationUrl';
import { useI18n } from '@/i18n';
import { useAuthFlowCopy } from './useAuthFlowCopy';

type WorkspaceAccessGateMode = 'blocked' | 'pending' | 'error';

interface WorkspaceAccessGateProps {
  mode: WorkspaceAccessGateMode;
  domain: string | null;
  onRetry?: () => void;
}

const WorkspaceAccessGate: React.FC<WorkspaceAccessGateProps> = ({ mode, domain, onRetry }) => {
  const t = useAuthFlowCopy();
  const { t: translate } = useI18n();
  const { signOut } = useAuth();
  const isPending = mode === 'pending';
  const isError = mode === 'error';

  return (
    <Page maxWidth="3xl" padding="responsive">
      <PageHeader
        title={
          isError
            ? t('authFlow.workspaceVerifyTitle')
            : isPending
              ? t('authFlow.workspacePendingTitle')
              : t('authFlow.workspaceRequiredTitle')
        }
        description={
          isError
            ? t('authFlow.workspaceVerifyDescription')
            : domain
              ? t('authFlow.claimedDomainDescription', { domain })
              : t('authFlow.workspaceDomainDescription')
        }
      />

      <Alert variant={isError || !isPending ? 'destructive' : 'default'}>
        {isPending ? <Clock3 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {isError
            ? t('authFlow.accessCheckFailed')
            : isPending
              ? t('authFlow.awaitingApproval')
              : t('authFlow.noAccessYet')}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          {isError ? (
            <p>
              {t('authFlow.workspaceRetryHelp')}
            </p>
          ) : isPending ? (
            <p>
              {t('authFlow.workspacePendingHelp')}
            </p>
          ) : (
            <p>
              {t('authFlow.workspaceBlockedHelp')}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {isError && onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                {t('authFlow.tryAgain')}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <a href={SUPPORT_DOCS_URL} target="_blank" rel="noopener noreferrer">
                {translate('profileMenu.helpCenter')}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void signOut();
              }}
            >
              {translate('profileMenu.signOut')}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </Page>
  );
};

export default WorkspaceAccessGate;
