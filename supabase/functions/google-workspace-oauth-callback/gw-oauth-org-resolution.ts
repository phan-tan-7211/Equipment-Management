import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";
import { logStep, normalizeDomain } from "./gw-oauth-validation.ts";
import {
  GoogleWorkspaceOAuthUserError,
  GW_OAUTH_ERROR_CODES,
} from "./gw-oauth-user-error.ts";

export async function resolveEffectiveOrganizationId(
  supabaseClient: SupabaseClient,
  params: {
    organizationId: string | null;
    userDomain: string;
    userId: string;
  },
): Promise<string> {
  const domain = normalizeDomain(params.userDomain);
  const effectiveOrgId = params.organizationId;

  if (!effectiveOrgId) {
    throw new Error("Existing organization is required to connect Google Workspace");
  }

  // Revalidate after the external OAuth redirect. The membership may have been
  // removed or downgraded since the session was created.
  const { data: membership, error: membershipError } = await supabaseClient
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", effectiveOrgId)
    .eq("user_id", params.userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError) {
    logStep("Failed to revalidate Workspace organization authorization", {
      organizationId: effectiveOrgId,
      error: membershipError.message,
    });
    throw new Error("Failed to verify organization authorization");
  }

  if (!membership) {
    throw new Error("Only active organization owners or admins can connect Google Workspace");
  }

  const { data: existingDomainData, error: domainError } = await supabaseClient
    .from("workspace_domains")
    .select("organization_id, domain")
    .eq("domain", domain)
    .maybeSingle();

  if (domainError) {
    logStep("Failed to check Workspace domain ownership", {
      domain,
      error: domainError.message,
    });
    throw new Error("Failed to verify Workspace domain ownership");
  }

  if (
    existingDomainData?.organization_id &&
    existingDomainData.organization_id !== effectiveOrgId
  ) {
    throw new GoogleWorkspaceOAuthUserError(
      GW_OAUTH_ERROR_CODES.DOMAIN_ALREADY_LINKED,
      "Workspace domain is already linked to another ZNTEQR organization",
    );
  }

  return effectiveOrgId;
}
