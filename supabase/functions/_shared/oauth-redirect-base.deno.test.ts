import { assertEquals } from "jsr:@std/assert@1";
import {
  buildOAuthCallbackRedirectUri,
  resolveOAuthRedirectBaseUrl,
} from "./oauth-redirect-base.ts";

Deno.test("resolveOAuthRedirectBaseUrl uses the canonical SUPABASE_URL", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(undefined, "https://wgynakhoppqkrutnslmv.supabase.co"),
    "https://wgynakhoppqkrutnslmv.supabase.co",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl honors an explicit canonical override", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(
      "https://wgynakhoppqkrutnslmv.supabase.co",
      "https://wgynakhoppqkrutnslmv.supabase.co",
    ),
    "https://wgynakhoppqkrutnslmv.supabase.co",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl falls back to SUPABASE_URL when override is whitespace-only", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl("   ", "https://wgynakhoppqkrutnslmv.supabase.co"),
    "https://wgynakhoppqkrutnslmv.supabase.co",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl honors a configured redirect base", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(
      "https://wgynakhoppqkrutnslmv.supabase.co",
      "https://wgynakhoppqkrutnslmv.supabase.co",
    ),
    "https://wgynakhoppqkrutnslmv.supabase.co",
  );
});

Deno.test("resolveOAuthRedirectBaseUrl uses the production project URL", () => {
  assertEquals(
    resolveOAuthRedirectBaseUrl(undefined, "https://wgynakhoppqkrutnslmv.supabase.co"),
    "https://wgynakhoppqkrutnslmv.supabase.co",
  );
});

Deno.test("buildOAuthCallbackRedirectUri appends callback path", () => {
  assertEquals(
    buildOAuthCallbackRedirectUri(
      "https://wgynakhoppqkrutnslmv.supabase.co/",
      "/functions/v1/quickbooks-oauth-callback",
    ),
    "https://wgynakhoppqkrutnslmv.supabase.co/functions/v1/quickbooks-oauth-callback",
  );
});
