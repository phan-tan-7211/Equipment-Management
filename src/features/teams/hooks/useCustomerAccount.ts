// fallow-ignore-file code-duplication
// Duplication rationale: Customer hooks repeat mutation invalidation patterns
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getCustomersByOrg,
  getCustomerById,
  createCustomer,
  updateCustomer,
  linkTeamToCustomer,
  importCustomerFromQB,
  refreshCustomerFromQB,
  remapCustomerFromQB,
  getExternalContacts,
  createExternalContact,
  updateExternalContact,
  deleteExternalContact,
  type ExternalContactFieldsInput,
} from '@/features/teams/services/customerAccountService';
import type {
  CustomerInsert,
  CustomerUpdate,
  ExternalContactInsert,
} from '@/features/teams/types/team';
import type { QBCustomerPayload } from '@/features/teams/services/customerAccountService';
import { useI18n } from '@/i18n';

// ============================================
// Customer Account Queries
// ============================================

export function useCustomersByOrg(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => getCustomersByOrg(organizationId!),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerById(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================
// Customer Account Mutations
// ============================================

function requireOrganizationId(organizationId: string | undefined, errorMessage: string): string {
  if (!organizationId) {
    throw new Error(errorMessage);
  }
  return organizationId;
}

export function useCustomerMutations(organizationId: string | undefined) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['teams', organizationId] });
  };

  const create = useMutation({
    mutationFn: (data: CustomerInsert) => createCustomer(data),
    onSuccess: () => invalidate(),
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CustomerUpdate }) =>
      updateCustomer(id, updates, organizationId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['customer', vars.id] });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  const link = useMutation({
    mutationFn: ({ teamId, customerId }: { teamId: string; customerId: string | null }) =>
      linkTeamToCustomer(teamId, customerId, organizationId),
    onSuccess: () => invalidate(),
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  const importFromQB = useMutation({
    mutationFn: ({ qb }: { qb: QBCustomerPayload }) =>
      importCustomerFromQB(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), qb),
    onSuccess: (data) => {
      toast({ title: t('teamsFeedback.imported'), description: t('teamsFeedback.importedDescription') });
      queryClient.invalidateQueries({ queryKey: ['external-contacts', data.id] });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.importFailed'), description: err.message, variant: 'destructive' });
    },
  });

  const refreshFromQB = useMutation({
    mutationFn: ({ customerId, qb }: { customerId: string; qb: QBCustomerPayload }) =>
      refreshCustomerFromQB(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), customerId, qb),
    onSuccess: (_data, vars) => {
      toast({ title: t('teamsFeedback.refreshed'), description: t('teamsFeedback.refreshedDescription') });
      queryClient.invalidateQueries({ queryKey: ['customer', vars.customerId] });
      queryClient.invalidateQueries({ queryKey: ['external-contacts', vars.customerId] });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.refreshFailed'), description: err.message, variant: 'destructive' });
    },
  });

  const remapFromQB = useMutation({
    mutationFn: ({ customerId, qb }: { customerId: string; qb: QBCustomerPayload }) =>
      remapCustomerFromQB(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), customerId, qb),
    onSuccess: (_data, vars) => {
      toast({ title: t('teamsFeedback.qbUpdated'), description: t('teamsFeedback.qbUpdatedDescription') });
      queryClient.invalidateQueries({ queryKey: ['customer', vars.customerId] });
      queryClient.invalidateQueries({ queryKey: ['external-contacts', vars.customerId] });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.updateFailed'), description: err.message, variant: 'destructive' });
    },
  });

  return { create, update, link, importFromQB, refreshFromQB, remapFromQB };
}

// ============================================
// External Contacts
// ============================================

export function useExternalContacts(customerId: string | undefined) {
  return useQuery({
    queryKey: ['external-contacts', customerId],
    queryFn: () => getExternalContacts(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useExternalContactMutations(
  organizationId: string | undefined,
  customerId: string | undefined
) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['external-contacts', customerId] });
  };

  const create = useMutation({
    mutationFn: (data: ExternalContactInsert) =>
      createExternalContact(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), data),
    onSuccess: () => {
      toast({ title: t('teamsFeedback.contactAdded') });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: ExternalContactFieldsInput }) =>
      updateExternalContact(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), id, fields),
    onSuccess: () => {
      toast({ title: t('teamsFeedback.contactUpdated') });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: (contactId: string) =>
      deleteExternalContact(requireOrganizationId(organizationId, t('teamsFeedback.selectOrg')), contactId),
    onSuccess: () => {
      toast({ title: t('teamsFeedback.contactRemoved') });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: t('teamsFeedback.error'), description: err.message, variant: 'destructive' });
    },
  });

  return { create, update, remove };
}
