import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronRight, Loader2, Mail, Plus, RotateCcw, Search, Shield, ShieldOff, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

type AccessRequest = {
  request_id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  request_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  organization_id: string | null;
  organization_name: string | null;
  assigned_role: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  rejection_reason: string | null;
};

const HISTORY_PAGE_SIZE = 20;

export default function PlatformAdministration() {
  const { language } = useI18n();
  const { formatDate, formatDateTime } = useFormatTimestamp();
  const copy = platformAdminCopy[language];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<'suspend' | 'reactivate' | null>(null);
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalOrganizations, setApprovalOrganizations] = useState<Record<string, string>>({});
  const [approvalRoles, setApprovalRoles] = useState<Record<string, string>>({});
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState<'all' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [historyPage, setHistoryPage] = useState(0);

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

  const accessRequestsQuery = useQuery({
    queryKey: ['platform-access-requests', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_list_access_requests', { p_status: null });
      if (error) throw error;
      return (data ?? []) as AccessRequest[];
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-organization'] }),
      queryClient.invalidateQueries({ queryKey: ['platform-access-requests'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('platform_create_organization_and_invite_owner', {
        p_organization_name: name.trim(), p_owner_email: ownerEmail.trim(),
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

  const approveAccessMutation = useMutation({
    mutationFn: async (request: AccessRequest) => {
      const organizationId = approvalOrganizations[request.request_id];
      const role = approvalRoles[request.request_id] ?? 'member';
      if (!organizationId) throw new Error(copy.accessRequestOrganizationRequired);
      const { error } = await supabase.rpc('platform_approve_access_request', {
        p_request_id: request.request_id,
        p_organization_id: organizationId,
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: async () => { await refresh(); toast.success(copy.accessRequestApproved); },
    onError: (error) => { logger.error('Access request approval failed', error); toast.error(copy.accessRequestApprovalFailed); },
  });

  const rejectAccessMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('platform_reject_access_request', {
        p_request_id: requestId,
        p_reason: rejectionReason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => { setRejectRequestId(null); setRejectionReason(''); await refresh(); toast.success(copy.accessRequestRejected); },
    onError: (error) => { logger.error('Access request rejection failed', error); toast.error(copy.accessRequestRejectionFailed); },
  });

  const detail = detailQuery.data;
  const organizations = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const accessRequests = useMemo(
    () => (accessRequestsQuery.data ?? []).filter((request) => request.request_status === 'pending'),
    [accessRequestsQuery.data],
  );
  const reviewedAccessRequests = useMemo(
    () => (accessRequestsQuery.data ?? []).filter((request) => request.request_status !== 'pending'),
    [accessRequestsQuery.data],
  );
  const filteredAccessRequestHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    return reviewedAccessRequests.filter((request) =>
      (historyStatus === 'all' || request.request_status === historyStatus)
      && (!term || [request.display_name, request.email, request.organization_name, request.reviewed_by_name]
        .some((value) => value?.toLowerCase().includes(term))));
  }, [reviewedAccessRequests, historySearch, historyStatus]);
  const historyPageCount = Math.max(1, Math.ceil(filteredAccessRequestHistory.length / HISTORY_PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, historyPageCount - 1);
  const accessRequestHistory = filteredAccessRequestHistory.slice(
    currentHistoryPage * HISTORY_PAGE_SIZE,
    (currentHistoryPage + 1) * HISTORY_PAGE_SIZE,
  );
  const activeOrganizations = organizations.filter((organization) => organization.lifecycle_status === 'active');
  const validCreate = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());
  const roleLabel = (role: string | null) => role === 'owner' ? copy.roleOwner : role === 'admin' ? copy.roleAdmin : role === 'viewer' ? copy.roleViewer : role === 'requestor' ? copy.roleRequestor : copy.roleMember;
  const requestStatusLabel = (requestStatus: AccessRequest['request_status']) => requestStatus === 'approved' ? copy.statusApproved : requestStatus === 'rejected' ? copy.statusRejected : requestStatus === 'cancelled' ? copy.statusCancelled : copy.pending;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Shield className="h-6 w-6 shrink-0 text-primary" /><div><h1 className="font-semibold">{copy.title}</h1><p className="text-xs text-muted-foreground">{copy.subtitle}</p></div></div><div className="ml-auto flex items-center gap-3"><LanguageSwitcher /><Button variant="outline" asChild><Link to="/dashboard">{copy.tenantDashboard}</Link></Button></div></div></header>
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <Dialog open={Boolean(rejectRequestId)} onOpenChange={(open) => { if (!open) setRejectRequestId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{copy.reject}</DialogTitle><DialogDescription>{copy.rejectionReasonHelp}</DialogDescription></DialogHeader>
            <Label htmlFor="access-rejection-reason">{copy.rejectionReasonLabel}</Label>
            <Textarea id="access-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} />
            <DialogFooter><Button variant="outline" onClick={() => setRejectRequestId(null)}>{copy.cancel}</Button><Button variant="destructive" disabled={!rejectionReason.trim() || rejectAccessMutation.isPending} onClick={() => rejectRequestId && rejectAccessMutation.mutate(rejectRequestId)}>{copy.reject}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Card>
          <CardHeader><CardTitle>{copy.accessRequests}</CardTitle><p className="text-sm text-muted-foreground">{copy.accessRequestsDescription}</p></CardHeader>
          <CardContent>
{accessRequestsQuery.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : accessRequestsQuery.isError ? <p className="py-4 text-sm text-destructive">{copy.accessRequestsLoadFailed}</p> : accessRequests.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{copy.noAccessRequests}</p> : <div className="space-y-3">{accessRequests.map((request) => <div key={request.request_id} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_220px_150px_auto] lg:items-center"><div><p className="font-medium">{request.display_name || request.email}</p><p className="text-sm text-muted-foreground">{request.email}</p><p className="text-xs text-muted-foreground">{formatPlatformAdminCopy(copy.accessRequestSubmitted, { date: formatDateTime(request.requested_at) })}</p></div><Select value={approvalOrganizations[request.request_id] ?? ''} onValueChange={(value) => setApprovalOrganizations((current) => ({ ...current, [request.request_id]: value }))}><SelectTrigger aria-label={copy.accessRequestOrganization}><SelectValue placeholder={copy.accessRequestOrganization} /></SelectTrigger><SelectContent>{activeOrganizations.map((organization) => <SelectItem key={organization.organization_id} value={organization.organization_id}>{organization.organization_name}</SelectItem>)}</SelectContent></Select><Select value={approvalRoles[request.request_id] ?? 'member'} onValueChange={(value) => setApprovalRoles((current) => ({ ...current, [request.request_id]: value }))}><SelectTrigger aria-label={copy.accessRequestRole}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{copy.roleOwner}</SelectItem><SelectItem value="admin">{copy.roleAdmin}</SelectItem><SelectItem value="member">{copy.roleMember}</SelectItem><SelectItem value="viewer">{copy.roleViewer}</SelectItem><SelectItem value="requestor">{copy.roleRequestor}</SelectItem></SelectContent></Select><div className="flex gap-2 lg:justify-end"><Button size="sm" disabled={!approvalOrganizations[request.request_id] || approveAccessMutation.isPending} onClick={() => approveAccessMutation.mutate(request)}><Check className="mr-2 h-4 w-4" />{copy.approve}</Button><Button size="sm" variant="outline" disabled={rejectAccessMutation.isPending} onClick={() => { setRejectionReason(''); setRejectRequestId(request.request_id); }}><X className="mr-2 h-4 w-4" />{copy.reject}</Button></div></div>)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{copy.accessRequestHistory}</CardTitle><p className="text-sm text-muted-foreground">{copy.accessRequestHistoryDescription}</p></CardHeader>
          <CardContent>
            {reviewedAccessRequests.length > 0 ? <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label={copy.historySearchAria} value={historySearch} onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(0); }} placeholder={copy.historySearchPlaceholder} className="pl-9" /></div><Select value={historyStatus} onValueChange={(value) => { setHistoryStatus(value as typeof historyStatus); setHistoryPage(0); }}><SelectTrigger aria-label={copy.historyFilterStatus}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{copy.allStatuses}</SelectItem><SelectItem value="approved">{copy.statusApproved}</SelectItem><SelectItem value="rejected">{copy.statusRejected}</SelectItem><SelectItem value="cancelled">{copy.statusCancelled}</SelectItem></SelectContent></Select></div> : null}
            {accessRequestsQuery.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : accessRequestsQuery.isError ? <p className="py-4 text-sm text-destructive">{copy.accessRequestsLoadFailed}</p> : reviewedAccessRequests.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{copy.noAccessRequestHistory}</p> : accessRequestHistory.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{copy.noAccessRequestHistoryMatches}</p> : <><div className="space-y-3">{accessRequestHistory.map((request) => <div key={request.request_id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{request.display_name || request.email}</p><Badge variant={request.request_status === 'approved' ? 'default' : request.request_status === 'rejected' ? 'destructive' : 'outline'}>{requestStatusLabel(request.request_status)}</Badge></div><p className="text-sm text-muted-foreground">{request.email}</p>{request.reviewed_at ? <p className="text-xs text-muted-foreground">{formatPlatformAdminCopy(copy.accessRequestReviewed, { date: formatDateTime(request.reviewed_at), name: request.reviewed_by_name || copy.reviewerFallback })}</p> : null}{request.rejection_reason ? <p className="mt-1 text-sm text-destructive">{request.rejection_reason}</p> : null}</div>{request.organization_name && request.assigned_role ? <p className="text-sm text-muted-foreground sm:text-right">{formatPlatformAdminCopy(copy.accessRequestDecision, { organization: request.organization_name, role: roleLabel(request.assigned_role) })}</p> : null}</div>)}</div>{historyPageCount > 1 ? <div className="mt-3 flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{formatPlatformAdminCopy(copy.historyPageSummary, { from: String(currentHistoryPage * HISTORY_PAGE_SIZE + 1), to: String(currentHistoryPage * HISTORY_PAGE_SIZE + accessRequestHistory.length), total: String(filteredAccessRequestHistory.length) })}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={currentHistoryPage === 0} onClick={() => setHistoryPage(currentHistoryPage - 1)}>{copy.previousPage}</Button><Button size="sm" variant="outline" disabled={currentHistoryPage >= historyPageCount - 1} onClick={() => setHistoryPage(currentHistoryPage + 1)}>{copy.nextPage}</Button></div></div> : null}</>}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-semibold">{copy.organizations}</h2><p className="text-sm text-muted-foreground">{copy.organizationsDescription}</p></div><Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{copy.createOrganization}</Button></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label={copy.searchAria} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={copy.searchPlaceholder} className="pl-9" /></div><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger aria-label={copy.filterLifecycle}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{copy.allStatuses}</SelectItem><SelectItem value="active">{copy.active}</SelectItem><SelectItem value="suspended">{copy.suspended}</SelectItem></SelectContent></Select></div>
        {listQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : listQuery.isError ? <Card><CardContent className="py-10 text-center text-destructive">{copy.loadFailed}</CardContent></Card> : organizations.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">{copy.noMatches}</CardContent></Card> : <div className="grid gap-3">{organizations.map((org) => <button key={org.organization_id} onClick={() => setSelectedId(org.organization_id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md border bg-card p-4 text-left hover:bg-muted/40"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{org.organization_name}</span><Badge variant={org.lifecycle_status === 'active' ? 'default' : 'destructive'}>{org.lifecycle_status === 'active' ? copy.active : copy.suspended}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{org.owner_email ? formatPlatformAdminCopy(copy.owner, { name: org.owner_name || org.owner_email, email: org.owner_email }) : org.pending_owner_email ? formatPlatformAdminCopy(copy.ownerPending, { email: org.pending_owner_email }) : copy.noActiveOwner}</p></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>)}</div>}
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>{copy.createOrganization}</DialogTitle><DialogDescription>{copy.createDescription}</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="platform-org-name">{copy.organizationName}</Label><Input id="platform-org-name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="platform-owner-email">{copy.initialOwnerEmail}</Label><Input id="platform-owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>{copy.cancel}</Button><Button disabled={!validCreate || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{copy.create}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{detail?.organization_name ?? copy.organizationDetails}</DialogTitle><DialogDescription>{detail?.organization_id}</DialogDescription></DialogHeader>{detailQuery.isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : !detail ? <p className="py-8 text-center text-muted-foreground">{copy.organizationNotFound}</p> : <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.lifecycle}</CardTitle></CardHeader><CardContent><Badge variant={detail.lifecycle_status === 'active' ? 'default' : 'destructive'}>{detail.lifecycle_status === 'active' ? copy.active : copy.suspended}</Badge><p className="mt-2 text-xs text-muted-foreground">{formatPlatformAdminCopy(copy.created, { date: formatDate(detail.created_at) })}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.currentOwner}</CardTitle></CardHeader><CardContent className="text-sm">{detail.owner_email ? <><p className="font-medium">{detail.owner_name || detail.owner_email}</p><p className="text-muted-foreground">{detail.owner_email}</p></> : <p className="text-muted-foreground">{copy.noActiveOwner}</p>}</CardContent></Card></div>{!detail.owner_user_id && detail.pending_owner_invitation_id && <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{copy.initialOwnerInvitation}</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{detail.pending_owner_email}</p><p className="text-xs text-muted-foreground">{detail.pending_owner_status === 'pending' && detail.pending_owner_expires_at ? formatPlatformAdminCopy(copy.expires, { date: formatDateTime(detail.pending_owner_expires_at) }) : detail.pending_owner_status === 'pending' ? copy.pending : detail.pending_owner_status}</p></div><Button variant="outline" disabled={!detail.pending_owner_can_resend || resendMutation.isPending} onClick={() => resendMutation.mutate(detail)}><Mail className="mr-2 h-4 w-4" />{copy.resend}</Button></CardContent></Card>}<div className="rounded-md border p-3 text-sm text-muted-foreground">{copy.ownershipNotice}</div><div className="flex justify-end">{detail.lifecycle_status === 'active' ? <Button variant="destructive" onClick={() => setLifecycleAction('suspend')}><ShieldOff className="mr-2 h-4 w-4" />{copy.suspend}</Button> : <Button onClick={() => setLifecycleAction('reactivate')}><RotateCcw className="mr-2 h-4 w-4" />{copy.reactivate}</Button>}</div></div>}</DialogContent></Dialog>

      <Dialog open={Boolean(lifecycleAction)} onOpenChange={(open) => !open && setLifecycleAction(null)}><DialogContent><DialogHeader><DialogTitle>{lifecycleAction === 'suspend' ? copy.suspendTitle : copy.reactivateTitle}</DialogTitle><DialogDescription>{lifecycleAction === 'suspend' ? copy.suspendDescription : copy.reactivateDescription}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setLifecycleAction(null)}>{copy.cancel}</Button><Button variant={lifecycleAction === 'suspend' ? 'destructive' : 'default'} disabled={lifecycleMutation.isPending} onClick={() => lifecycleAction && lifecycleMutation.mutate(lifecycleAction)}>{copy.confirm}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
