import React, { useState } from 'react';
import { useMountFocus } from '@/components/a11y/keyboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSimpleOrganizationSafe } from '@/hooks/useSimpleOrganization';
import { useSubmitTicket } from '../hooks/useSubmitTicket';
import { collectSessionDiagnostics } from '../utils/sessionDiagnostics';
import { useI18n } from '@/i18n';

interface SubmitTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for submitting in-app bug reports.
 * Automatically gathers comprehensive session diagnostics (anonymized, no PII).
 * Creates a GitHub issue and a database record.
 */
const SubmitTicketDialog: React.FC<SubmitTicketDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useI18n();
  const { mutate: submitTicket, isPending } = useSubmitTicket();
  const queryClient = useQueryClient();
  const orgContext = useSimpleOrganizationSafe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const titleInputRef = useMountFocus<HTMLInputElement>(open);

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      toast.error(t('tickets.titleDescriptionRequired'));
      return;
    }

    if (trimmedTitle.length < 5) {
      toast.error(t('tickets.titleTooShort'));
      return;
    }

    if (trimmedDescription.length < 10) {
      toast.error(t('tickets.descriptionTooShort'));
      return;
    }

    // Collect comprehensive session diagnostics (anonymized, no PII)
    const metadata = collectSessionDiagnostics(
      orgContext ? {
        organizationId: orgContext.organizationId,
        currentOrganization: orgContext.currentOrganization,
      } : undefined,
      queryClient,
    );

    submitTicket(
      {
        title: trimmedTitle,
        description: trimmedDescription,
        metadata,
      },
      {
        onSuccess: () => {
          toast.success(t('tickets.submittedSuccess'));
          resetForm();
          onOpenChange(false);
        },
        onError: (error) => {
          console.error('Failed to submit ticket:', error);
          toast.error(t('tickets.submittedFailed'));
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{t('tickets.reportIssue')}</DialogTitle>
          <DialogDescription>
            {t('tickets.reportDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-title">{t('tickets.title')}</Label>
            <Input
              ref={titleInputRef}
              id="ticket-title"
              placeholder={t('tickets.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">{t('tickets.descriptionSteps')}</Label>
            <Textarea
              id="ticket-description"
              placeholder={t('tickets.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={5000}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t('tickets.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('tickets.submitting')}
                </>
              ) : (
                t('tickets.submitReport')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitTicketDialog;
