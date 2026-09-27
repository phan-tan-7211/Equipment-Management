import { assertEquals } from "jsr:@std/assert@1";
import { isActiveOrganizationStatus } from "./lifecycle.ts";

Deno.test("Workspace sync permits only ACTIVE organizations", () => {
  assertEquals(isActiveOrganizationStatus("active"), true);
  assertEquals(isActiveOrganizationStatus("suspended"), false);
  assertEquals(isActiveOrganizationStatus(undefined), false);
});
