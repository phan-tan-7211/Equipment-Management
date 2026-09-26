import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Loader2, Mail, Plus, RotateCcw, Search, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n';
import { formatPlatformAdminCopy, platformAdminCopy } from '../platformAdminCopy';

type OrganizationSummary = {
  organization_id: string;
  organization_name: string;
  lifecycle_status: 'active' | 'suspended';
  created_at: string;
  owner_user_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  pending_owner_invitation_id: string | null;
  pending_owner_email: string | null;
  pending_owner_expires_at: string | null;
  pending_owner_status?: string | null;
  pending_owner_can_resend: boolean;
};

export default function PlatformAdministration() {
  const { user } = useAuth();
  const { language } = useI18n();
  const copy = platformAdminCopy[language];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<'suspend' | 'reactivate' | null>(null);
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const listQuery = useQuery({
    queryKey: ['platform-organizations', search.trim(), status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_list_organizations', {
        p_search: search.trim() || null,
        p_lifecycle_status: status === 'all' ? null : status,
      });
      if (error) throw error;
      return (data ?? []) as OrganizationSummary[];
    },
  });

  const detailQuery = useQuery({
    queryKey: ['platform-organization', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_get_organization', { p_organization_id: selectedId! });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as OrganizationSummary | null;
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-organization'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('platform_create_organization_and_invite_owner', {
        p_organization_name: name.trim(), p_owner_email: ownerEmail.trim(), p_message: null,
      });
      if (error) throw error;
      const created = (data ?? [])[0];
      if (!created) throw new Error(copy.provisioningEmpty);
      let emailDelivered = true;
      try {
        const result = await supabase.functions.invoke('send-invitation-email', {
          body: { invitationId: created.invitation_id, organizationId: created.organization_id, inviterName: 'ZNTEQR Platform Administration' },
        });
        if (result.error) throw result.error;
      } catch (error) {
        emailDelivered = false;
        logger.error('Initial owner invitation email delivery failed', error);
      }
      return { created, emailDelivered };
    },
    onSuccess: async ({ created, emailDelivered }) => {
      setCreateOpen(false); setName(''); setOwnerEmail(''); setSelectedId(created.organization_id);
      await refresh();
      if (emailDelivered) toast.success(copy.createSuccess);
      else toast.warning(copy.createEmailFailed);
    },
    onError: (error) => { logger.error('Platform organization provisioning failed', error); toast.error(copy.createFailed); },
  });

  const lifecycleMutation = useMutation({
    mutationFn: async (action: 'suspend' | 'reactivate') => {
      const rpc = action === 'suspend' ? 'platform_suspend_organization' : 'platform_reactivate_organization';
      const { error } = await supabase.rpc(rpc, { p_organization_id: selectedId!, p_reason: 'Platform Administration UI' });
      if (error) throw error;
    },
    onSuccess: async (_, action) => { setLifecycleAction(null); await refresh(); toast.success(action === 'suspend' ? copy.suspendedSuccess : copy.reactivatedSuccess); },
    onError: (error) => { logger.error('Organization lifecycle action failed', error); toast.error(copy.lifecycleRejected); },
  });

  const resendMutation = useMutation({
    mutationFn: async (organization: OrganizationSummary) => {
      if (!organization.pending_owner_invitation_id || !organization.pending_owner_can_resend) throw new Error(copy.invitationIneligible);
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitationId: organization.pending_owner_invitation_id, organizationId: organization.organization_id, inviterName: 'ZNTEQR Platform Administration' },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success(copy.resendSuccess),
    onError: (error) => { logger.error('Owner invitation resend failed', error); toast.error(copy.resendFailed); },
  });

  const detail = detailQuery.data;
  const organizations = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const validCreate = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Shield className="h-6 w-6 shrink-0 text-primary" /><div><h1 className="font-semibold">{copy.title}</h1><p className="text-xs text-muted-foreground">{copy.subtitle}</p></div></div><div className="ml-auto flex items-center gap-3"><LanguageSwitcher /><Button variant="outline" asChild><Link to="/dashboard">{copy.tenantDashboard}</Link></Button></div></div></header>
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-semibold">{copy.organizations}</h2><p className="text-sm text-muted-foreground">{copy.organizationsDescription}</p></div><Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{copy.createOrganization}</Button></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label={copy.searchAria} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={copy.searchPlaceholder} className="pl-9" /></div><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger aria-label={copy.filterLifecycle}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{copy.allStatuses}</SelectItem><SelectItem value="active">{copy.active}</SelectItem><SelectItem value="suspended">{copy.suspended}</SelectItem></SelectContent></Select></div>
        {listQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : listQuery.isError ? <Card><CardContent className="py-10 text-center text-destructive">{copy.loadFailed}</CardContent></Card> : organizations.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">{copy.noMatches}</CardContent></Card> : <div className="grid gap-3">{organizations.map((org) => <button key={org.organization_id} onClick={() => setSelectedId(org.organization_id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md border bg-card p-4 text-left hover:bg-muted/40"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{org.organization_name}</span><Badge variant={org.lifecycle_status === 'active' ? 'default' : 'destructive'}>{org.lifecycle_status === 'active' ? copy.active : copy.suspended}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{org.owner_email ? formatPlatformAdminCopy(copy.owner, { name: org.owner_name || org.owner_email, email: org.owner_email }) : org.pending_owner_email ? formatPlatformAdminCopy(copy.ownerPending, { email: org.pending_owner_email }) : copy.noActiveOwner}</p></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>)}</div>}
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>{copy.createOrganization}</DialogTitle><DialogDescription>{copy.createDescription}</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="platform-org-name">{copy.organizationName}</Label><Input id="platform-org-name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="platform-owner-email">{copy.initialOwnerEmail}</Label><Input id="platform-owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>{copy.cancel}</Button><Button disabled={!validCreate || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{copy.create}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{detail?.organization_name ?? copy.organizationDetails}</DialogTitle><DialogDescription>{detail?.organization_id}</DialogDescription></DialogHeader>{detailQuery.isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : !detail ? <p className="py-8 text-center text-muted-foreground">{copy.organizationNotFound}</p> : <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.lifecycle}</CardTitle></CardHeader><CardContent><Badge variant={detail.lifecycle_status === 'active' ? 'default' : 'destructive'}>{detail.lifecycle_status === 'active' ? copy.active : copy.suspended}</Badge><p className="mt-2 text-xs text-muted-foreground">{formatPlatformAdminCopy(copy.created, { date: new Date(detail.created_at).toLocaleDateString(language) })}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.currentOwner}</CardTitle></CardHeader><CardContent className="text-sm">{detail.owner_email ? <><p className="font-medium">{detail.owner_name || detail.owner_email}</p><p className="text-muted-foreground">{detail.owner_email}</p></> : <p className="text-muted-foreground">{copy.noActiveOwner}</p>}</CardContent></Card></div>{!detail.owner_user_id && detail.pending_owner_invitation_id && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.initialOwnerInvitation}</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{detail.pending_owner_email}</p><p className="text-xs text-muted-foreground">{detail.pending_owner_status === 'pending' && detail.pending_owner_expires_at ? formatPlatformAdminCopy(copy.expires, { date: new Date(detail.pending_owner_expires_at).toLocaleString(language) }) : detail.pending_owner_status === 'pending' ? copy.pending : detail.pending_owner_status}</p></div><Button variant="outline" disabled={!detail.pending_owner_can_resend || resendMutation.isPending} onClick={() => resendMutation.mutate(detail)}><Mail className="mr-2 h-4 w-4" />{copy.resend}</Button></CardContent></Card>}<div className="rounded-md border p-3 text-sm text-muted-foreground">{copy.ownershipNotice}</div><div className="flex justify-end">{detail.lifecycle_status === 'active' ? <Button variant="destructive" onClick={() => setLifecycleAction('suspend')}><ShieldOff className="mr-2 h-4 w-4" />{copy.suspend}</Button> : <Button onClick={() => setLifecycleAction('reactivate')}><RotateCcw className="mr-2 h-4 w-4" />{copy.reactivate}</Button>}</div></div>}</DialogContent></Dialog>

      <Dialog open={Boolean(lifecycleAction)} onOpenChange={(open) => !open && setLifecycleAction(null)}><DialogContent><DialogHeader><DialogTitle>{lifecycleAction === 'suspend' ? copy.suspendTitle : copy.reactivateTitle}</DialogTitle><DialogDescription>{lifecycleAction === 'suspend' ? copy.suspendDescription : copy.reactivateDescription}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setLifecycleAction(null)}>{copy.cancel}</Button><Button variant={lifecycleAction === 'suspend' ? 'destructive' : 'default'} disabled={lifecycleMutation.isPending} onClick={() => lifecycleAction && lifecycleMutation.mutate(lifecycleAction)}>{copy.confirm}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
