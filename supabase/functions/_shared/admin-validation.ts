/** Backend Platform Admin validation utilities. */

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";

/**
 * Verify Platform Admin authority against the private database registry.
 * The RPC is executable only by service_role and never derives authority from
 * organization membership, JWT metadata, email, or frontend state.
 */
export async function verifyPlatformAdminAccess(
  supabaseClient: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc("is_platform_admin", {
      p_user_id: userId,
    });

    if (error) {
      console.error(
        "[ADMIN-VALIDATION] Error checking Platform Admin access:",
        error,
      );
      return false;
    }

    return data === true;
  } catch (error) {
    console.error(
      "[ADMIN-VALIDATION] Exception checking Platform Admin access:",
      error,
    );
    return false;
  }
}
