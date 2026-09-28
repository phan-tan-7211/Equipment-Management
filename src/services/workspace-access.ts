import { supabase } from '@/integrations/supabase/client';

export type WorkspaceAccessRequestStatus =
  | 'pending'
  | 'invitation_pending'
  | 'already_authorized'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface WorkspaceAccessRequest {
  request_id: string | null;
  request_status: WorkspaceAccessRequestStatus;
  organization_id: string | null;
  organization_name: string | null;
  assigned_role: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export async function ensureWorkspaceAccessRequest(): Promise<WorkspaceAccessRequest> {
  const { data, error } = await supabase.rpc('ensure_workspace_access_request');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('Workspace access request state was not returned');
  }
  return data[0] as WorkspaceAccessRequest;
}
