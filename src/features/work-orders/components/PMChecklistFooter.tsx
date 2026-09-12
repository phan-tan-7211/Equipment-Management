import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw } from 'lucide-react';
import type { PMChecklistItem } from '@/features/pm-templates/services/preventativeMaintenanceService';
import { useVoiceTextAppender } from '@/hooks/useVoiceTextAppender';
import VoiceInputButton from '@/components/common/VoiceInputButton';
import VoiceInterimTranscript from '@/components/common/VoiceInterimTranscript';
import { useI18n } from '@/i18n';

type PMChecklistFooterProps = {
  pmStatus: string;
  readOnly: boolean;
  isAdmin: boolean;
  notes: string;
  unratedRequiredItems: PMChecklistItem[];
  unsafeItems: PMChecklistItem[];
  isUpdating: boolean;
  isReverting: boolean;
  isSettingAllOK: boolean;
  completedAt?: string | null;
  formattedCompletedAt?: string;
  willReopenWorkOrder?: boolean;
  onNotesChange: (value: string) => void;
  onSaveChanges: () => void;
  onCompletePM: () => void;
  onShowSetAllOKDialog: () => void;
  onShowRevertPMDialog: () => void;
};

export function PMChecklistFooter({
  pmStatus,
  readOnly,
  isAdmin,
  notes,
  unratedRequiredItems,
  unsafeItems,
  isUpdating,
  isReverting,
  isSettingAllOK,
  completedAt,
  formattedCompletedAt,
  willReopenWorkOrder = false,
  onNotesChange,
  onSaveChanges,
  onCompletePM,
  onShowSetAllOKDialog,
  onShowRevertPMDialog,
}: PMChecklistFooterProps) {
  const { t } = useI18n();
  const notesDisabled = readOnly || pmStatus === 'completed';

  const {
    isListening,
    error: speechError,
    interimTranscript,
    toggleListening,
    canUseVoice,
  } = useVoiceTextAppender({
    value: notes,
    onChange: onNotesChange,
    disabled: notesDisabled,
  });

  return (
    <>
      {pmStatus !== 'completed' && unratedRequiredItems.length > 0 && (
        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-destructive">
            {t('workOrderResidual.requiredItems', { count: unratedRequiredItems.length })}
            {!readOnly && (
              <>
                {' '}
                <button
                  onClick={onShowSetAllOKDialog}
                  className="text-destructive underline hover:no-underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                  disabled={isSettingAllOK}
                >
                  {t('workOrderResidual.setAllOk')}
                </button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {pmStatus !== 'completed' && unsafeItems.length > 0 && (
        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-destructive">
            {t('workOrderResidual.unsafeItems', { count: unsafeItems.length })}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {pmStatus === 'completed' ? (
          <p className="text-base font-semibold">{t('workOrderResidual.generalNotes')}</p>
        ) : (
          <label htmlFor="pm-general-notes" className="text-base font-semibold">
            {t('workOrderResidual.generalNotes')}
          </label>
        )}
        {pmStatus === 'completed' ? (
          <>
            <p className="text-xs text-muted-foreground">{t('workOrderResidual.completedNotesLocked')}</p>
            <div className="rounded-md border bg-muted/30 px-3 py-3 text-[15px] text-foreground">
              {notes.trim() ? (
                <p className="whitespace-pre-wrap">{notes}</p>
              ) : (
                <p className="text-muted-foreground">{t('workOrderResidual.noGeneralNotes')}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Textarea
                id="pm-general-notes"
                placeholder={t('workOrderResidual.generalNotesPlaceholder')}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                disabled={notesDisabled}
                rows={3}
                className="text-[15px] text-foreground placeholder:text-muted-foreground/70 pb-12"
              />
              <VoiceInterimTranscript
                isListening={isListening}
                interimTranscript={interimTranscript}
                className="bottom-12 left-2 right-2"
              />
              <VoiceInputButton
                isListening={isListening}
                onToggle={toggleListening}
                canUseVoice={canUseVoice}
                className="absolute bottom-2 left-2"
              />
            </div>
            {speechError && (
              <p className="text-sm text-destructive">{speechError}</p>
            )}
          </>
        )}
      </div>

      {!readOnly && pmStatus !== 'completed' && (
        <div className="flex gap-2 pt-4">
          <Button onClick={onSaveChanges} disabled={isUpdating} variant="outline">
            {isUpdating ? t('workOrderResidual.saving') : t('workOrderResidual.saveChanges')}
          </Button>
          <Button
            onClick={onCompletePM}
            disabled={
              isUpdating || unratedRequiredItems.length > 0 || unsafeItems.length > 0
            }
          >
            {isUpdating ? t('workOrderResidual.completing') : t('workOrderResidual.completePm')}
          </Button>
        </div>
      )}

      {isAdmin && pmStatus === 'completed' && (
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {willReopenWorkOrder
              ? t('workOrderResidual.revertReopensHint')
              : t('workOrderResidual.revertHint')}
          </p>
          <Button
            onClick={onShowRevertPMDialog}
            disabled={isReverting}
            variant="outline"
            className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('workOrderResidual.revertPm')}
          </Button>
        </div>
      )}

      {completedAt && formattedCompletedAt && (
        <div className="pt-4 border-t text-sm text-muted-foreground">
          {t('workOrderOperations.pmCompletedOn', { date: formattedCompletedAt })}
        </div>
      )}
    </>
  );
}
