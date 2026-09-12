import { useI18n } from '@/i18n';
import React, { useMemo, useState } from 'react';
import { Eye, Plus, ShieldCheck, Trash2, Users, Wrench } from 'lucide-react';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useOrganizationMembers } from '@/features/organization/hooks/useOrganizationMembers';
import {
  usePartsManagers,
  useAddPartsManager,
  useRemovePartsManager,
} from '@/features/inventory/hooks/usePartsManagers';
import {
  usePartsConsumers,
  useAddPartsConsumer,
  useRemovePartsConsumer,
} from '@/features/inventory/hooks/usePartsConsumers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MultiSelectActionMenu,
  type MultiSelectActionOption,
} from '@/components/common/MultiSelectActionMenu';
import type { PartsRoleRecord } from '@/features/inventory/services/partsRoleServiceHelpers';

interface PartsAccessSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PartsRoleSectionProps {
  roleLabel: string;
  roleDescription: string;
  icon: React.ReactNode;
  idPrefix: string;
  assignees: PartsRoleRecord[];
  isLoading: boolean;
  addOptions: MultiSelectActionOption[];
  isAddPending: boolean;
  onAdd: (userIds: string[]) => Promise<void>;
  onRequestRemove: (assignee: PartsRoleRecord) => void;
  emptyText: string;
}

function PartsRoleSection({
  roleLabel,
  roleDescription,
  icon,
  idPrefix,
  assignees,
  isLoading,
  addOptions,
  isAddPending,
  onAdd,
  onRequestRemove,
  emptyText,
}: PartsRoleSectionProps) {
  const { t } = useI18n();
  const { formatDate } = useFormatTimestamp();

  return (
    <section aria-label={roleLabel} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold">{roleLabel}</h3>
          <Badge variant="outline" className="text-xs">
            {assignees.length}
          </Badge>
        </div>
        <MultiSelectActionMenu
          idPrefix={idPrefix}
          trigger={
            <Button type="button" variant="outline" size="sm" disabled={isAddPending}>
              <Plus className="mr-1 h-4 w-4" />
              {t('inventoryListAux.add')}
            </Button>
          }
          title={t('inventoryListAux.addRole', { role: roleLabel })}
          description={roleDescription}
          options={addOptions}
          isPending={isAddPending}
          searchPlaceholder={t('inventoryListAux.searchMembers')}
          emptyText={t('inventoryListAux.allAssigned')}
          noMatchText={t('inventoryListAux.noMemberMatch')}
          actionLabel={(count) =>
            isAddPending ? t('inventoryListAux.adding') : t('inventoryListAux.addCount', { count })
          }
          onAction={onAdd}
        />
      </div>
      <p className="text-xs text-muted-foreground">{roleDescription}</p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : assignees.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 py-6 text-center">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {assignees.map((assignee) => (
            <li
              key={assignee.user_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{assignee.userName}</p>
                <p className="truncate text-xs text-muted-foreground">{assignee.userEmail}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('inventoryListAux.addedOn', { date: formatDate(assignee.assigned_at) })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 shrink-0"
                aria-label={t('inventoryListAux.removeFromRole', { name: assignee.userName, role: roleLabel })}
                onClick={() => onRequestRemove(assignee)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One sheet to manage both inventory access grants (issue #1152): Parts
 * Managers (edit) and Parts Consumers (view + part lookup), replacing the
 * managers-only sheet and the separate Members-page-only consumer toggles.
 */
export const PartsAccessSheet: React.FC<PartsAccessSheetProps> = ({ open, onOpenChange }) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { canManagePartsManagers, canManagePartsConsumers } = usePermissions();
  const canManage = canManagePartsManagers() && canManagePartsConsumers();

  const [removal, setRemoval] = useState<
    { role: 'manager' | 'consumer'; assignee: PartsRoleRecord } | null
  >(null);

  const { data: partsManagers = [], isLoading: managersLoading } = usePartsManagers(
    currentOrganization?.id,
  );
  const { data: partsConsumers = [], isLoading: consumersLoading } = usePartsConsumers(
    currentOrganization?.id,
  );
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id ?? '');

  const addManagerMutation = useAddPartsManager();
  const removeManagerMutation = useRemovePartsManager();
  const addConsumerMutation = useAddPartsConsumer();
  const removeConsumerMutation = useRemovePartsConsumer();

  // Owners/admins always have full inventory access, so only plain active
  // members are eligible for either grant.
  const eligibleMembers = useMemo(
    () => members.filter((member) => member.status === 'active' && member.role === 'member'),
    [members],
  );

  const buildAddOptions = (existing: PartsRoleRecord[]): MultiSelectActionOption[] => {
    const grantedIds = new Set(existing.map((record) => record.user_id));
    return eligibleMembers
      .filter((member) => !grantedIds.has(member.id))
      .map((member) => ({
        id: member.id,
        label: member.name || t('inventoryListAux.unknown'),
        sublabel: member.email ?? undefined,
      }));
  };

  const handleAdd = async (
    mutation: typeof addManagerMutation | typeof addConsumerMutation,
    userIds: string[],
  ) => {
    if (!currentOrganization) return;
    await Promise.all(
      userIds.map((userId) =>
        mutation.mutateAsync({ organizationId: currentOrganization.id, userId }),
      ),
    );
  };

  const handleConfirmRemove = async () => {
    if (!currentOrganization || !removal) return;
    const mutation = removal.role === 'manager' ? removeManagerMutation : removeConsumerMutation;
    try {
      await mutation.mutateAsync({
        organizationId: currentOrganization.id,
        userId: removal.assignee.user_id,
      });
    } finally {
      setRemoval(null);
    }
  };

  if (!canManage) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('inventoryListAux.partsAccess')}</SheetTitle>
            <SheetDescription>{t('inventoryListAux.accessSubtitle')}</SheetDescription>
          </SheetHeader>
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">{t('inventoryListAux.accessDenied')}</h3>
            <p className="text-muted-foreground">
              {t('inventoryListAux.accessDeniedHelp')}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('inventoryListAux.partsAccess')}
            </SheetTitle>
            <SheetDescription>
              {t('inventoryListAux.accessDescription')}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-8">
            <PartsRoleSection
              roleLabel={t('inventoryListAux.managers')}
              roleDescription={t('inventoryListAux.managersDescription')}
              icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
              idPrefix="parts-manager"
              assignees={partsManagers}
              isLoading={managersLoading}
              addOptions={buildAddOptions(partsManagers)}
              isAddPending={addManagerMutation.isPending}
              onAdd={(userIds) => handleAdd(addManagerMutation, userIds)}
              onRequestRemove={(assignee) => setRemoval({ role: 'manager', assignee })}
              emptyText={t('inventoryListAux.noManagers')}
            />

            <PartsRoleSection
              roleLabel={t('inventoryListAux.consumers')}
              roleDescription={t('inventoryListAux.consumersDescription')}
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
              idPrefix="parts-consumer"
              assignees={partsConsumers}
              isLoading={consumersLoading}
              addOptions={buildAddOptions(partsConsumers)}
              isAddPending={addConsumerMutation.isPending}
              onAdd={(userIds) => handleAdd(addConsumerMutation, userIds)}
              onRequestRemove={(assignee) => setRemoval({ role: 'consumer', assignee })}
              emptyText={t('inventoryListAux.noConsumers')}
            />

            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-2 text-sm font-medium">{t('inventoryListAux.aboutPermissions')}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• <strong>{t('inventoryListAux.ownersAdmins')}</strong> {t('inventoryListAux.ownersHelp')}</li>
                <li>• <strong>{t('inventoryListAux.managers')}</strong> {t('inventoryListAux.managersHelp')}</li>
                <li>• <strong>{t('inventoryListAux.consumers')}</strong> {t('inventoryListAux.consumersHelp')}</li>
                <li>• <strong>{t('inventoryListAux.noGrant')}</strong> {t('inventoryListAux.noGrantHelp')}</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!removal} onOpenChange={(nextOpen) => !nextOpen && setRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removal?.role === 'manager' ? t('inventoryListAux.removeManagerTitle') : t('inventoryListAux.removeConsumerTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removal?.role === 'manager'
                ? t('inventoryListAux.removeManagerDescription', { name: removal?.assignee.userName ?? '' })
                : t('inventoryListAux.removeConsumerDescription', { name: removal?.assignee.userName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('inventoryListAux.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmRemove()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('inventoryListAux.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
