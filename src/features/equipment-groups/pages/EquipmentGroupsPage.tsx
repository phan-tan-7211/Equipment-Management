import { useMemo, useState } from 'react';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationSubnav } from '@/features/organization/components/OrganizationSubnav';
import RestrictedOrganizationAccess from '@/features/organization/components/RestrictedOrganizationAccess';
import { useEquipmentGroupMutations, useEquipmentGroups } from '@/features/equipment-groups/hooks/useEquipmentGroups';
import type { EquipmentGroupInput, EquipmentGroupWithCount } from '@/features/equipment-groups/types';

const emptyForm: EquipmentGroupInput = {
  code: '',
  name: '',
  examples: '',
  management_focus: '',
  description: '',
  is_active: true,
};

export default function EquipmentGroupsPage() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const organizationId = currentOrganization?.id;
  const canManage = currentOrganization?.userRole === 'owner' || currentOrganization?.userRole === 'admin';
  const { data: groups = [], isLoading, error } = useEquipmentGroups(organizationId);
  const mutations = useEquipmentGroupMutations(organizationId);
  const [editing, setEditing] = useState<EquipmentGroupWithCount | null>(null);
  const [form, setForm] = useState<EquipmentGroupInput>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);

  const issuedCount = useMemo(
    () => groups.reduce((sum, group) => sum + Math.max(0, group.next_sequence - 1), 0),
    [groups],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (group: EquipmentGroupWithCount) => {
    setEditing(group);
    setForm({
      code: group.code,
      name: group.name,
      examples: group.examples ?? '',
      management_focus: group.management_focus ?? '',
      description: group.description ?? '',
      is_active: group.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Group code and group name are required');
      return;
    }
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, input: form });
        toast.success('Equipment group updated');
      } else {
        await mutations.create.mutateAsync(form);
        toast.success('Equipment group created');
      }
      setDialogOpen(false);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save equipment group');
    }
  };

  const toggleActive = async (group: EquipmentGroupWithCount) => {
    try {
      await mutations.setActive.mutateAsync({ id: group.id, isActive: !group.is_active });
      toast.success(group.is_active ? 'Equipment group deactivated' : 'Equipment group activated');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update equipment group');
    }
  };

  const remove = async (group: EquipmentGroupWithCount) => {
    if (group.equipment_count > 0 || group.next_sequence > 1) return;
    if (!window.confirm(`Delete unused equipment group ${group.code} - ${group.name}?`)) return;
    try {
      await mutations.remove.mutateAsync(group.id);
      toast.success('Equipment group deleted');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to delete equipment group');
    }
  };

  if (orgLoading || !currentOrganization) {
    return <Page maxWidth="7xl" padding="responsive"><p className="text-muted-foreground">Loading...</p></Page>;
  }

  if (!canManage) {
    return <Page maxWidth="7xl" padding="responsive"><RestrictedOrganizationAccess currentOrganizationName={currentOrganization.name} /></Page>;
  }

  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <OrganizationSubnav />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted/40 p-2.5"><Boxes className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Equipment Groups</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Define asset classifications used to issue stable management codes. Rename guidance freely; issued codes never change.
              </p>
            </div>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add group</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Groups</p><p className="mt-1 text-2xl font-semibold">{groups.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Active</p><p className="mt-1 text-2xl font-semibold">{groups.filter((g) => g.is_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Codes issued</p><p className="mt-1 text-2xl font-semibold">{issuedCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <p className="p-6 text-muted-foreground">Loading equipment groups...</p> : error ? (
              <p className="p-6 text-destructive">Unable to load equipment groups.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Code</th><th className="px-4 py-3">Equipment group</th><th className="px-4 py-3">Examples</th><th className="px-4 py-3">Management focus</th><th className="px-4 py-3 text-right">Equipment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groups.map((group) => {
                      const codeLocked = group.next_sequence > 1;
                      const deletable = group.equipment_count === 0 && !codeLocked;
                      return (
                        <tr key={group.id} className="align-top">
                          <td className="px-4 py-4 font-mono font-semibold">{group.code}</td>
                          <td className="px-4 py-4"><p className="font-medium">{group.name}</p>{group.description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{group.description}</p>}</td>
                          <td className="px-4 py-4 max-w-xs text-muted-foreground">{group.examples || '—'}</td>
                          <td className="px-4 py-4 max-w-xs text-muted-foreground">{group.management_focus || '—'}</td>
                          <td className="px-4 py-4 text-right font-tabular">{group.equipment_count}</td>
                          <td className="px-4 py-4"><button className={`rounded-full px-2.5 py-1 text-xs font-medium ${group.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`} onClick={() => toggleActive(group)}>{group.is_active ? 'Active' : 'Inactive'}</button></td>
                          <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(group)} aria-label={`Edit ${group.name}`}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={!deletable} onClick={() => remove(group)} title={deletable ? 'Delete unused group' : 'Used groups cannot be deleted; deactivate instead'} aria-label={`Delete ${group.name}`}><Trash2 className="h-4 w-4" /></Button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit equipment group' : 'Add equipment group'}</DialogTitle><DialogDescription>Examples and management focus help administrators classify new assets consistently.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block space-y-1.5"><span className="text-sm font-medium">Group code *</span><Input value={form.code} disabled={Boolean(editing && editing.next_sequence > 1)} maxLength={10} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} placeholder="PE" />{editing && editing.next_sequence > 1 && <span className="text-xs text-muted-foreground">Locked because this group has already issued management codes.</span>}</label>
            <label className="block space-y-1.5"><span className="text-sm font-medium">Group name *</span><Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="Production Equipment" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-medium">Examples</span><Input value={form.examples ?? ''} onChange={(e) => setForm((v) => ({ ...v, examples: e.target.value }))} placeholder="Press, Mixer, Coating machine, Oven" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-medium">Management focus</span><Input value={form.management_focus ?? ''} onChange={(e) => setForm((v) => ({ ...v, management_focus: e.target.value }))} placeholder="PM, maintenance, working hours" /></label>
            <label className="block space-y-1.5"><span className="text-sm font-medium">Description</span><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description ?? ''} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} /></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={mutations.create.isPending || mutations.update.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
