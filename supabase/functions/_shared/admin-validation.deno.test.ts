import { deepStrictEqual } from "node:assert/strict";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";
import { verifyPlatformAdminAccess } from "./admin-validation.ts";

function fakeClient(
  result: { data: boolean | null; error: unknown },
  calls: Array<{ functionName: string; args: Record<string, string> }>,
): SupabaseClient {
  return {
    rpc(functionName: string, args: Record<string, string>) {
      calls.push({ functionName, args });
      return Promise.resolve(result);
    },
  } as unknown as SupabaseClient;
}

Deno.test("verifyPlatformAdminAccess uses the backend registry predicate", async () => {
  const calls: Array<{ functionName: string; args: Record<string, string> }> =
    [];
  const allowed = await verifyPlatformAdminAccess(
    fakeClient({ data: true, error: null }, calls),
    "user-1",
  );

  deepStrictEqual(allowed, true);
  deepStrictEqual(calls, [{
    functionName: "is_platform_admin",
    args: { p_user_id: "user-1" },
  }]);
});

Deno.test("verifyPlatformAdminAccess denies a non-admin predicate result", async () => {
  const denied = await verifyPlatformAdminAccess(
    fakeClient({ data: false, error: null }, []),
    "user-2",
  );

  deepStrictEqual(denied, false);
});

Deno.test("verifyPlatformAdminAccess fails closed on predicate errors", async () => {
  const denied = await verifyPlatformAdminAccess(
    fakeClient({ data: null, error: { message: "database unavailable" } }, []),
    "user-3",
  );

  deepStrictEqual(denied, false);
});
