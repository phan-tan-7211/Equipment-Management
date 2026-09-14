import { useI18n } from '@/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DsrLifecycleActionsProps {
  canManageDsr: boolean;
  canVerify: boolean;
  isProcessing: boolean;
  onVerify: (verificationMethod: string) => void;
  onComplete: () => void;
  onDeny: (reason: string) => void;
  onExtend: (reason: string) => void;
}

export function DsrLifecycleActions({
  canManageDsr,
  canVerify,
  isProcessing,
  onVerify,
  onComplete,
  onDeny,
  onExtend,
}: DsrLifecycleActionsProps) {
  const { t } = useI18n();
  const [verificationMethod, setVerificationMethod] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [extendReason, setExtendReason] = useState('');

  if (!canManageDsr) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <h3 className="text-sm font-medium">{t('dsr.lifecycleActions')}</h3>
      <div className="space-y-2">
        <Select value={verificationMethod} onValueChange={setVerificationMethod} disabled={!canVerify}>
          <SelectTrigger aria-label={t('dsr.verificationMethod')}>
            <SelectValue placeholder={t('dsr.selectVerification')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="authenticated_match">{t('dsr.verification.authenticated_match')}</SelectItem>
            <SelectItem value="email_challenge">{t('dsr.verification.email_challenge')}</SelectItem>
            <SelectItem value="manual_review">{t('dsr.verification.manual_review')}</SelectItem>
            <SelectItem value="authorized_agent">{t('dsr.verification.authorized_agent')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onVerify(verificationMethod)}
          disabled={!canVerify || !verificationMethod}
        >
          {t('dsr.verifyStart')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onComplete} disabled={!isProcessing}>
          {t('dsr.complete')}
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          value={denyReason}
          onChange={(event) => setDenyReason(event.target.value)}
          placeholder={t('dsr.denialReason')}
          aria-label={t('dsr.denialReason')}
        />
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeny(denyReason)}
          disabled={!denyReason.trim()}
        >
          {t('dsr.denyRequest')}
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          value={extendReason}
          onChange={(event) => setExtendReason(event.target.value)}
          placeholder={t('dsr.extensionReason')}
          aria-label={t('dsr.extensionReason')}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExtend(extendReason)}
          disabled={!extendReason.trim()}
        >
          {t('dsr.extendDeadline')}
        </Button>
      </div>
    </div>
  );
}
