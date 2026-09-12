// fallow-ignore-file code-duplication
// Duplication rationale: Create dialog shares native select styling with metadata editor

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useTeamMutations } from '@/features/teams/hooks/useTeamManagement';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomerMutations } from '@/features/teams/hooks/useCustomerAccount';
import { TeamCreateFields } from '@/features/teams/components/TeamCreateFields';
import {
  buildTeamCreatePayload,
  emptyTeamCreateFieldsValue,
  resolveTeamCreateCustomerId,
} from '@/features/teams/utils/teamCreateFields';

import { useI18n } from '@/i18n';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({ open, onClose, organizationId }) => {
  const { t } = useI18n();
  const [fields, setFields] = useState(emptyTeamCreateFieldsValue);
  const [nameError, setNameError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { createTeamWithCreator } = useTeamMutations();
  const queryClient = useQueryClient();
  const customerMutations = useCustomerMutations(organizationId);

  const resetForm = useCallback(() => {
    setFields(emptyTeamCreateFieldsValue());
    setNameError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fields.name.trim()) {
      setNameError(t('teamsDetail.nameRequired'));
      return;
    }

    if (!user?.id) {
      toast({
        title: t('teamsDetail.error'),
        description: t('teamsDetail.loginRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      const customerId = await resolveTeamCreateCustomerId(
        organizationId,
        fields,
        (input) => customerMutations.create.mutateAsync(input),
      );

      await createTeamWithCreator.mutateAsync({
        teamData: buildTeamCreatePayload(organizationId, fields, customerId),
        creatorId: user.id
      });

      toast({
        title: t('teamsDetail.success'),
        description: t('teamsDetail.createdSuccess'),
      });

      queryClient.invalidateQueries({ queryKey: ['access-snapshot'] });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{t('teamsDetail.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('teamsDetail.createDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <TeamCreateFields
            organizationId={organizationId}
            value={fields}
            onChange={(next) => {
              setFields(next);
              if (next.name.trim()) setNameError('');
            }}
            nameError={nameError}
            idPrefix="create-team"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('teamsDetail.cancel')}
            </Button>
            <Button type="submit" disabled={createTeamWithCreator.isPending}>
              {createTeamWithCreator.isPending ? t('teamsDetail.creating') : t('teamsDetail.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;
