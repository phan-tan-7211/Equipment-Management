import { assertEquals } from "jsr:@std/assert@1";
import {
  buildOAuthCallbackRedirectUri,
  resolveOAuthRedirectBaseUrl,
} from "./oauth-redirect-base.ts";

Deno.test("resolveOAuthRedirectBaseUrl maps legacy preview project URL to custom Supabase hostname", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(undefined, "https://olsdirkvvfegvclbpgrg.supabase.co"),
    "https://supabase.CEV.PhanTan.app",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl normalizes retired preview Supabase hostname", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(
      "https://supabase.preview.CEV.PhanTan.app",
      "https://olsdirkvvfegvclbpgrg.supabase.co",
    ),
    "https://supabase.CEV.PhanTan.app",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl falls back to SUPABASE_URL when override is whitespace-only", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl("   ", "https://olsdirkvvfegvclbpgrg.supabase.co"),
    "https://supabase.CEV.PhanTan.app",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl normalizes stale preview Supabase app hostname", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(
      "https://preview.supabase.app",
      "https://olsdirkvvfegvclbpgrg.supabase.co",
    ),
    "https://supabase.CEV.PhanTan.app",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl maps production project URL to custom Supabase hostname", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(undefined, "https://ymxkzronkhwxzcdcbnwq.supabase.co"),
    "https://supabase.CEV.PhanTan.app",
  );
});

Deno.test("buildOAuthCallbackRedirectUri appends callback path", () => {
  assertEquals(
    buildOAuthCallbackRedirectUri(
      "https://supabase.CEV.PhanTan.app/",
      "/functions/v1/quickbooks-oauth-callback",
    ),
    "https://supabase.CEV.PhanTan.app/functions/v1/quickbooks-oauth-callback",
  );
});

