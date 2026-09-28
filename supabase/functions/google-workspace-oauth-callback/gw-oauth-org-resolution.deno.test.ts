import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";
import { resolveEffectiveOrganizationId } from "./gw-oauth-org-resolution.ts";
import { GoogleWorkspaceOAuthUserError } from "./gw-oauth-user-error.ts";

function buildClient(options: {
  membership?: { role: string; status: string } | null;
  domainOrganizationId?: string | null;
}): SupabaseClient {
  return {
    from(table: string) {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        maybeSingle: async () => table === "organization_members"
          ? { data: options.membership ?? null, error: null }
          : {
            data: options.domainOrganizationId
              ? { organization_id: options.domainOrganizationId, domain: "example.com" }
              : null,
            error: null,
          },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

Deno.test("Workspace callback requires an existing organization", async () => {
  await assertRejects(
    () => resolveEffectiveOrganizationId(buildClient({}), {
      organizationId: null,
      userDomain: "example.com",
      userId: "user-1",
    }),
    Error,
    "Existing organization is required",
  );
});

Deno.test("Workspace callback accepts an active owner of the selected organization", async () => {
  const organizationId = await resolveEffectiveOrganizationId(
    buildClient({ membership: { role: "owner", status: "active" } }),
    {
      organizationId: "org-1",
      userDomain: " Example.COM ",
      userId: "user-1",
    },
  );

  assertEquals(organizationId, "org-1");
});

Deno.test("Workspace callback rejects authorization revoked during OAuth redirect", async () => {
  await assertRejects(
    () => resolveEffectiveOrganizationId(buildClient({ membership: null }), {
      organizationId: "org-1",
      userDomain: "example.com",
      userId: "user-1",
    }),
    Error,
    "Only active organization owners or admins",
  );
});

Deno.test("Workspace callback cannot reassign another organization's domain", async () => {
  await assertRejects(
    () => resolveEffectiveOrganizationId(buildClient({
      membership: { role: "admin", status: "active" },
      domainOrganizationId: "org-2",
    }), {
      organizationId: "org-1",
      userDomain: "example.com",
      userId: "user-1",
    }),
    GoogleWorkspaceOAuthUserError,
    "already linked to another ZNTEQR organization",
  );
});
