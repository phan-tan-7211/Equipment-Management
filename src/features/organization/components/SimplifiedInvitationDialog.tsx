
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInvitation } from '@/features/organization/hooks/useOrganizationInvitations';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';

interface SimplifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SimplifiedInvitationDialog: React.FC<SimplifiedInvitationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const { currentOrganization } = useOrganization();
  const createInvitation = useCreateInvitation(currentOrganization?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization?.id) {
      toast.error(t('organizationMembers.noOrganization'));
      return;
    }

    if (!email.trim()) {
      toast.error(t('organizationMembers.emailRequired'));
      return;
    }

    try {
      await createInvitation.mutateAsync({
        email: email.trim(),
        role,
      });

      setEmail('');
      setRole('member');
    } catch {
      // Swallowed: the mutation hook surfaces the error toast; rethrowing here
      // would only produce an unhandled rejection in the submit handler.
    } finally {
      // Close on every terminal outcome (#1081): the mutation hook already
      // surfaces success/error toasts, so keeping the modal open on failure
      // only hides that feedback behind the dialog overlay.
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('organizationMembers.invitationTitle')}</DialogTitle>
          <DialogDescription>
            {t('organizationMembers.invitationDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('organizationMembers.emailAddress')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('organizationMembers.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">{t('organizationMembers.role')}</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('organizationMembers.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{t('organizationMembers.member')}</SelectItem>
                <SelectItem value="admin">{t('organizationMembers.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('organizationMembers.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createInvitation.isPending}
            >
              {createInvitation.isPending ? t('organizationMembers.sending') : t('organizationMembers.send')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
