Warning: truncated output (original token count: 231724)
Total output lines: 25077




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Storage reference note:
-- Supabase-managed storage objects are intentionally excluded from this
-- application schema dump. The Phase 2 bucket and scoped object policies are
-- defined in supabase/migrations/20260916120000_create_display_images_bucket.sql.


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";







CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "pgmq_public";


ALTER SCHEMA "pgmq_public" OWNER TO "postgres";


COMMENT ON SCHEMA "pgmq_public" IS 'Public-facing SECURITY DEFINER wrappers around the pgmq.* functions, mirroring the schema that Supabase Dashboard provisions when "Enable Queues" is clicked. Created here in migration so the queue pattern works in any environment (local dev, ephemeral PR branches, preview, production) without requiring a Dashboard click-through. See Change Record on issue #722.';



COMMENT ON SCHEMA "public" IS 'EquipQR application schema. SECURITY DEFINER EXECUTE grants follow docs/ops/security-definer-rpc-policy.md (issues #762, #1310).';



CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."equipment_status" AS ENUM (
    'active',
    'maintenance',
    'inactive'
);


ALTER TYPE "public"."equipment_status" OWNER TO "postgres";


CREATE TYPE "public"."inventory_transaction_type" AS ENUM (
    'usage',
    'restock',
    'adjustment',
    'initial',
    'work_order'
);


ALTER TYPE "public"."inventory_transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."model_match_type" AS ENUM (
    'any',
    'exact',
    'prefix',
    'wildcard'
);


ALTER TYPE "public"."model_match_type" OWNER TO "postgres";


CREATE TYPE "public"."organization_plan" AS ENUM (
    'free',
    'premium'
);


ALTER TYPE "public"."organization_plan" OWNER TO "postgres";


CREATE TYPE "public"."part_identifier_type" AS ENUM (
    'oem',
    'aftermarket',
    'sku',
    'mpn',
    'upc',
    'cross_ref'
);


ALTER TYPE "public"."part_identifier_type" OWNER TO "postgres";


CREATE TYPE "public"."team_member_role" AS ENUM (
    'owner',
    'manager',
    'technician',
    'requestor',
    'viewer'
);


ALTER TYPE "public"."team_member_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'unverified',
    'verified',
    'deprecated'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE TYPE "public"."work_order_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."work_order_priority" OWNER TO "postgres";


CREATE TYPE "public"."work_order_status" AS ENUM (
    'submitted',
    'accepted',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."work_order_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  result boolean;
BEGIN
  SELECT pgmq.archive(
    queue_name => queue_name,
    msg_id => message_id
  ) INTO result;
  RETURN COALESCE(result, false);
END;
$$;


ALTER FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  result boolean;
BEGIN
  SELECT pgmq.delete(
    queue_name => queue_name,
    msg_id => message_id
  ) INTO result;
  RETURN COALESCE(result, false);
END;
$$;


ALTER FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."pop"("queue_name" "text") RETURNS TABLE("msg_id" bigint, "read_ct" integer, "enqueued_at" timestamp with time zone, "vt" timestamp with time zone, "message" "jsonb", "headers" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM pgmq.pop(queue_name => queue_name);
END;
$$;


ALTER FUNCTION "pgmq_public"."pop"("queue_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) RETURNS TABLE("msg_id" bigint, "read_ct" integer, "enqueued_at" timestamp with time zone, "vt" timestamp with time zone, "message" "jsonb", "headers" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM pgmq.read(
    queue_name => queue_name,
    vt => sleep_seconds,
    qty => n
  );
END;
$$;


ALTER FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM pgmq.send(
    queue_name => queue_name,
    msg => message,
    delay => sleep_seconds
  );
END;
$$;


ALTER FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_invoke_quickbooks_token_refresh_internal"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
DECLARE
  service_role_key text;
  supabase_url text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url'
  LIMIT 1;

  IF service_role_key IS NULL OR supabase_url IS NULL THEN
    RAISE WARNING 'QuickBooks token refresh skipped: vault secrets not configured';
    RETURN;
  END IF;

  IF supabase_url !~ '^https://[A-Za-z0-9.-]+\.supabase\.co/?$' THEN
    RAISE WARNING 'QuickBooks token refresh skipped: invalid supabase_url format in vault secrets';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/quickbooks-refresh-tokens',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  IF request_id IS NULL THEN
    RAISE WARNING 'Failed to schedule QuickBooks token refresh invocation';
  END IF;
END;
$_$;


ALTER FUNCTION "public"."_invoke_quickbooks_token_refresh_internal"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."_invoke_quickbooks_token_refresh_internal"() IS 'Internal vault-backed QuickBooks token refresh HTTP call. Not callable via PostgREST; used by pg_cron wrapper invoke_quickbooks_token_refresh() and refresh_quickbooks_tokens_manual().';



CREATE OR REPLACE FUNCTION "public"."accept_invitation_atomic"("p_invitation_token" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  invitation_record RECORD;
  org_name TEXT;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id, organization_id, email, role, status, expires_at, accepted_by
  INTO invitation_record
  FROM organization_invitations
  WHERE invitation_token = p_invitation_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF invitation_record.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has already been processed');
  END IF;

  IF invitation_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id
      AND lower(trim(email)) = lower(trim(invitation_record.email))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User email does not match invitation email');
  END IF;

  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = invitation_record.organization_id
      AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this organization');
  END IF;

  UPDATE organization_invitations
  SET
    status = 'accepted',
    accepted_at = now(),
    accepted_by = p_user_id,
    updated_at = now()
  WHERE id = invitation_record.id;

  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    access_source
  ) VALUES (
    invitation_record.organization_id,
    p_user_id,
    invitation_record.role,
    'active',
    'invitation'
  );

  SELECT name INTO org_name
  FROM organizations
  WHERE id = invitation_record.organization_id;

  result := jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'organization_name', COALESCE(org_name, 'Unknown Organization'),
    'role', invitation_record.role
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this organization');
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to accept invitation. Please try again or contact support.'
    );
END;
$$;


ALTER FUNCTION "public"."accept_invitation_atomic"("p_invitation_token" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_inventory_quantity"("p_item_id" "uuid", "p_delta" integer, "p_reason" "text", "p_work_order_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_organization_id UUID;
  v_work_order_org_id UUID;
  v_transaction_type inventory_transaction_type;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF p_delta IS NULL THEN
    RAISE EXCEPTION 'Inventory adjustment delta cannot be null';
  END IF;

  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Inventory adjustment delta cannot be zero';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT quantity_on_hand, organization_id
  INTO v_current_quantity, v_organization_id
  FROM public.inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_current_quantity IS NULL THEN
    RAISE EXCEPTION 'Inventory item not found: %', p_item_id;
  END IF;

  IF p_work_order_id IS NOT NULL THEN
    SELECT organization_id
    INTO v_work_order_org_id
    FROM public.work_orders
    WHERE id = p_work_order_id;

    IF v_work_order_org_id IS NULL OR v_work_order_org_id <> v_organization_id THEN
      RAISE EXCEPTION 'Work order does not belong to the inventory item organization';
    END IF;
  END IF;

  -- Parts Managers (and org owners/admins) may adjust freely. Parts Consumers
  -- may only make work-order-scoped adjustments (consume/restore) on work
  -- orders they hold operational cost access to.
  IF NOT public.can_manage_inventory(v_organization_id, v_user_id) THEN
    IF p_work_order_id IS NULL
       OR NOT public.can_access_inventory(v_organization_id, v_user_id)
       OR NOT public.can_access_work_order_costs(p_work_order_id, v_user_id) THEN
      RAISE EXCEPTION 'User does not have permission to adjust inventory';
    END IF;
  END IF;

  v_new_quantity := v_current_quantity + p_delta;

  IF p_delta < 0 AND v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: requested % units, but only % available',
      ABS(p_delta), v_current_quantity;
  END IF;

  IF v_new_quantity < -1000 THEN
    RAISE WARNING 'Inventory item % for org % adjusted by user % to suspiciously low quantity: %',
      p_item_id, v_organization_id, v_user_id, v_new_quantity;
  END IF;

  IF p_work_order_id IS NOT NULL THEN
    v_transaction_type := 'work_order';
  ELSIF p_delta < 0 THEN
    v_transaction_type := 'usage';
  ELSIF p_delta > 0 THEN
    v_transaction_type := 'restock';
  END IF;

  UPDATE public.inventory_items
  SET
    quantity_on_hand = v_new_quantity,
    updated_at = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.inventory_transactions (
    inventory_item_id,
    organization_id,
    user_id,
    previous_quantity,
    new_quantity,
    change_amount,
    transaction_type,
    work_order_id,
    notes
  ) VALUES (
    p_item_id,
    v_organization_id,
    v_user_id,
    v_current_quantity,
    v_new_quantity,
    p_delta,
    v_transaction_type,
    p_work_order_id,
    p_reason
  );

  RETURN v_new_quantity;
END;
$$;


ALTER FUNCTION "public"."adjust_inventory_quantity"("p_item_id" "uuid", "p_delta" integer, "p_reason" "text", "p_work_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."adjust_inventory_quantity"("p_item_id" "uuid", "p_delta" integer, "p_reason" "text", "p_work_order_id" "uuid") IS 'Adjusts inventory quantity with transaction logging. Parts Managers (and org owners/admins) may adjust freely; Parts Consumers may only make work-order-scoped adjustments on work orders where they hold operational cost access. The work order must belong to the same organization as the inventory item.';



CREATE OR REPLACE FUNCTION "public"."anonymize_audit_changes"("p_changes" "jsonb", "p_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $_$
BEGIN
  RETURN regexp_replace(
    p_changes::text,
    regexp_replace(p_email, '([.\+\*\?\[\]\(\)\{\}\|\\^$])', '\\\1', 'g'),
    '[redacted]',
    'gi'
  )::jsonb;
END;
$_$;


ALTER FUNCTION "public"."anonymize_audit_changes"("p_changes" "jsonb", "p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anonymize_audit_changes"("p_changes" "jsonb", "p_email" "text") IS 'Replaces occurrences of an email address inside a JSONB changes payload with [redacted].';



CREATE OR REPLACE FUNCTION "public"."anonymize_audit_log_for_user"("p_email" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.audit_log
  SET actor_name  = 'Deleted User',
      actor_email = '[redacted]',
      changes     = public.anonymize_audit_changes(changes, p_email)
  WHERE actor_email = p_email;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;


ALTER FUNCTION "public"."anonymize_audit_log_for_user"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."anonymize_audit_log_for_user"("p_email" "text") IS 'Replaces actor_name, actor_email, and scrubs the email from changes JSONB for all audit_log rows matching the given email. Used for CCPA deletion requests.';



CREATE OR REPLACE FUNCTION "public"."apply_account_deletion_storage_metadata"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_delete_paths jsonb := '[]'::jsonb;
  v_reassigned integer := 0;
BEGIN
  SELECT coalesce(jsonb_agg(jsonb_build_object('bucket', bucket_id, 'path', name)), '[]'::jsonb)
  INTO v_delete_paths
  FROM storage.objects
  WHERE owner_id = p_user_id
    AND bucket_id = 'user-avatars';

  UPDATE storage.objects
  SET owner = NULL,
      owner_id = NULL
  WHERE owner_id = p_user_id
    AND bucket_id IN ('work-order-images', 'equipment-note-images', 'inventory-item-images');

  GET DIAGNOSTICS v_reassigned = ROW_COUNT;

  RETURN jsonb_build_object(
    'delete_paths', v_delete_paths,
    'reassigned_object_count', v_reassigned
  );
END;
$$;


ALTER FUNCTION "public"."apply_account_deletion_storage_metadata"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count int := 0;
  v_caller uuid := (select auth.uid());
BEGIN
  -- Self-only guard (quiet variant)
  --   * In trigger / service-role context (auth.uid() IS NULL): allow execution.
  --     handle_new_user() relies on this branch.
  --   * In user context with mismatched p_user_id: log and return 0 instead of
  --     raising. The function is idempotent and the call is non-essential, so
  --     a benign no-op is preferable to a 400 in the browser console.
  IF v_caller IS NOT NULL AND p_user_id IS DISTINCT FROM v_caller THEN
    RAISE NOTICE 'apply_pending_admin_grants_for_user: caller % attempted to apply grants for % -- ignored',
      v_caller, p_user_id;
    RETURN 0;
  END IF;

  IF NOT public.is_user_google_oauth_verified(p_user_id) THEN
    RETURN 0;
  END IF;

  UPDATE public.organization_members om
  SET role = 'admin'
  FROM auth.users u
  WHERE om.user_id = p_user_id
    AND u.id = p_user_id
    AND public.normalize_email(u.email) IN (
      SELECT public.normalize_email(pg.email)
      FROM public.organization_role_grants_pending pg
      WHERE pg.status = 'pending'
        AND pg.organization_id = om.organization_id
    )
    AND om.role = 'member';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.organization_role_grants_pending pg
  SET status = 'applied',
      applied_user_id = p_user_id,
      applied_at = now()
  FROM auth.users u
  WHERE u.id = p_user_id
    AND pg.status = 'pending'
    AND public.normalize_email(pg.email) = public.normalize_email(u.email);

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") IS 'Promotes the supplied user to admin in any organization that has a matching pending grant (by normalized email). Self-only when called in user context (quiet no-op on mismatch); permissive in trigger / service-role context. Idempotent and safe to call repeatedly.';



CREATE OR REPLACE FUNCTION "public"."assert_inventory_read_access"("p_organization_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no authenticated user context'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.can_access_inventory(p_organization_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: user cannot access inventory for this organization'
      USING ERRCODE = '42501';
  END IF;
END;
$$;


ALTER FUNCTION "public"."assert_inventory_read_access"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_equipment_management_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_group public.equipment_groups%ROWTYPE;
  v_sequence bigint;
  v_prefix text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.management_code IS NOT NULL
     AND NEW.management_code IS DISTINCT FROM OLD.management_code THEN
    RAISE EXCEPTION 'Equipment management code cannot be changed after it is issued';
  END IF;

  IF NEW.management_code IS NOT NULL OR NEW.equipment_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_group
  FROM public.equipment_groups
  WHERE id = NEW.equipment_group_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment group not found'; END IF;
  IF v_group.organization_id <> NEW.organization_id THEN RAISE EXCEPTION 'Equipment group must belong to the same organization as the equipment'; END IF;
  IF NOT v_group.is_active THEN RAISE EXCEPTION 'Inactive equipment groups cannot issue new management codes'; END IF;

  v_sequence := v_group.next_sequence;
  UPDATE public.equipment_groups SET next_sequence = next_sequence + 1 WHERE id = v_group.id;
  SELECT upper(trim(equipment_code_prefix)) INTO v_prefix FROM public.organizations WHERE id = NEW.organization_id;
  NEW.management_code := concat(v_prefix, '-', v_group.code, '-', lpad(v_sequence::text, 6, '0'));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_equipment_management_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_equipment_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entity_name := OLD.name;
  ELSE
    v_entity_name := NEW.name;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', NULL, 'new', NEW.name),
      'status', jsonb_build_object('old', NULL, 'new', NEW.status),
      'location', jsonb_build_object('old', NULL, 'new', NEW.location),
      'manufacturer', jsonb_build_object('old', NULL, 'new', NEW.manufacturer),
      'model', jsonb_build_object('old', NULL, 'new', NEW.model),
      'serial_number', jsonb_build_object('old', NULL, 'new', NEW.serial_number),
      'installation_date', jsonb_build_object('old', NULL, 'new', NEW.installation_date),
      'warranty_expiration', jsonb_build_object('old', NULL, 'new', NEW.warranty_expiration),
      'notes', jsonb_build_object('old', NULL, 'new', NEW.notes),
      'custom_attributes', jsonb_build_object('old', NULL, 'new', NEW.custom_attributes),
      'management_responsible_primary', jsonb_build_object('old', NULL, 'new', NEW.management_responsible_primary),
      'management_responsible_secondary', jsonb_build_object('old', NULL, 'new', NEW.management_responsible_secondary)
    );
    v_metadata := jsonb_build_object(
      'team_id', NEW.team_id,
      'default_pm_template_id', NEW.default_pm_template_id,
      'customer_id', NEW.customer_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    IF OLD.location IS DISTINCT FROM NEW.location THEN
      v_changes := v_changes || jsonb_build_object('location', jsonb_build_object('old', OLD.location, 'new', NEW.location));
    END IF;
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      v_changes := v_changes || jsonb_build_object('team_id', jsonb_build_object('old', OLD.team_id, 'new', NEW.team_id));
    END IF;
    IF OLD.warranty_expiration IS DISTINCT FROM NEW.warranty_expiration THEN
      v_changes := v_changes || jsonb_build_object('warranty_expiration', jsonb_build_object('old', OLD.warranty_expiration, 'new', NEW.warranty_expiration));
    END IF;
    IF OLD.working_hours IS DISTINCT FROM NEW.working_hours THEN
      v_changes := v_changes || jsonb_build_object('working_hours', jsonb_build_object('old', OLD.working_hours, 'new', NEW.working_hours));
    END IF;
    IF OLD.last_maintenance IS DISTINCT FROM NEW.last_maintenance THEN
      v_changes := v_changes || jsonb_build_object('last_maintenance', jsonb_build_object('old', OLD.last_maintenance, 'new', NEW.last_maintenance));
    END IF;
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      v_changes := v_changes || jsonb_build_object('notes', jsonb_build_object('old', OLD.notes, 'new', NEW.notes));
    END IF;
    IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
      v_changes := v_changes || jsonb_build_object('image_url', jsonb_build_object('old', OLD.image_url, 'new', NEW.image_url));
    END IF;
    IF OLD.manufacturer IS DISTINCT FROM NEW.manufacturer THEN
      v_changes := v_changes || jsonb_build_object('manufacturer', jsonb_build_object('old', OLD.manufacturer, 'new', NEW.manufacturer));
    END IF;
    IF OLD.model IS DISTINCT FROM NEW.model THEN
      v_changes := v_changes || jsonb_build_object('model', jsonb_build_object('old', OLD.model, 'new', NEW.model));
    END IF;
    IF OLD.serial_number IS DISTINCT FROM NEW.serial_number THEN
      v_changes := v_changes || jsonb_build_object('serial_number', jsonb_build_object('old', OLD.serial_number, 'new', NEW.serial_number));
    END IF;
    IF OLD.default_pm_template_id IS DISTINCT FROM NEW.default_pm_template_id THEN
      v_changes := v_changes || jsonb_build_object('default_pm_template_id', jsonb_build_object('old', OLD.default_pm_template_id, 'new', NEW.default_pm_template_id));
    END IF;
    IF OLD.installation_date IS DISTINCT FROM NEW.installation_date THEN
      v_changes := v_changes || jsonb_build_object('installation_date', jsonb_build_object('old', OLD.installation_date, 'new', NEW.installation_date));
    END IF;
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
      v_changes := v_changes || jsonb_build_object('customer_id', jsonb_build_object('old', OLD.customer_id, 'new', NEW.customer_id));
    END IF;
    IF OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes THEN
      v_changes := v_changes || jsonb_build_object('custom_attributes', jsonb_build_object('old', OLD.custom_attributes, 'new', NEW.custom_attributes));
    END IF;
    IF OLD.management_responsible_primary IS DISTINCT FROM NEW.management_responsible_primary THEN
      v_changes := v_changes || jsonb_build_object('management_responsible_primary', jsonb_build_object('old', OLD.management_responsible_primary, 'new', NEW.management_responsible_primary));
    END IF;
    IF OLD.management_responsible_secondary IS DISTINCT FROM NEW.management_responsible_secondary THEN
      v_changes := v_changes || jsonb_build_object('management_responsible_secondary', jsonb_build_object('old', OLD.management_responsible_secondary, 'new', NEW.management_responsible_secondary));
    END IF;
    IF OLD.last_known_location IS DISTINCT FROM NEW.last_known_location THEN
      v_changes := v_changes || jsonb_build_object('last_known_location', jsonb_build_object('old', OLD.last_known_location, 'new', NEW.last_known_location));
    END IF;

    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', OLD.name, 'new', NULL),
      'status', jsonb_build_object('old', OLD.status, 'new', NULL),
      'manufacturer', jsonb_build_object('old', OLD.manufacturer, 'new', NULL),
      'model', jsonb_build_object('old', OLD.model, 'new', NULL),
      'serial_number', jsonb_build_object('old', OLD.serial_number, 'new', NULL),
      'location', jsonb_build_object('old', OLD.location, 'new', NULL),
      'custom_attributes', jsonb_build_object('old', OLD.custom_attributes, 'new', NULL),
      'management_responsible_primary', jsonb_build_object('old', OLD.management_responsible_primary, 'new', NULL),
      'management_responsible_secondary', jsonb_build_object('old', OLD.management_responsible_secondary, 'new', NULL)
    );
  END IF;

  PERFORM public.log_audit_entry(
    COALESCE(NEW.organization_id, OLD.organization_id),
    'equipment',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_equipment_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_equipment_classification_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE v_changes jsonb := '{}'::jsonb;
BEGIN
  IF OLD.equipment_group_id IS DISTINCT FROM NEW.equipment_group_id THEN
    v_changes := v_changes || jsonb_build_object('equipment_group_id', jsonb_build_object('old', OLD.equipment_group_id, 'new', NEW.equipment_group_id));
  END IF;
  IF OLD.management_code IS DISTINCT FROM NEW.management_code THEN
    v_changes := v_changes || jsonb_build_object('management_code', jsonb_build_object('old', OLD.management_code, 'new', NEW.management_code));
  END IF;
  IF v_changes <> '{}'::jsonb THEN
    PERFORM public.log_audit_entry(NEW.organization_id, 'equipment', NEW.id, NEW.name, 'UPDATE', v_changes, jsonb_build_object('source', 'equipment_classification'));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_equipment_classification_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_equipment_group_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE v_changes jsonb := '{}'::jsonb; v_row public.equipment_groups%ROWTYPE;
BEGIN
  v_row := COALESCE(NEW, OLD);
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object('code', jsonb_build_object('old', NULL, 'new', NEW.code),'name', jsonb_build_object('old', NULL, 'new', NEW.name),'examples', jsonb_build_object('old', NULL, 'new', NEW.examples),'management_focus', jsonb_build_object('old', NULL, 'new', NEW.management_focus),'description', jsonb_build_object('old', NULL, 'new', NEW.description),'is_active', jsonb_build_object('old', NULL, 'new', NEW.is_active));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.code IS DISTINCT FROM NEW.code THEN v_changes := v_changes || jsonb_build_object('code', jsonb_build_object('old', OLD.code, 'new', NEW.code)); END IF;
    IF OLD.name IS DISTINCT FROM NEW.name THEN v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name)); END IF;
    IF OLD.examples IS DISTINCT FROM NEW.examples THEN v_changes := v_changes || jsonb_build_object('examples', jsonb_build_object('old', OLD.examples, 'new', NEW.examples)); END IF;
    IF OLD.management_focus IS DISTINCT FROM NEW.management_focus THEN v_changes := v_changes || jsonb_build_object('management_focus', jsonb_build_object('old', OLD.management_focus, 'new', NEW.management_focus)); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description)); END IF;
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN v_changes := v_changes || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active)); END IF;
    IF v_changes = '{}'::jsonb THEN RETURN NEW; END IF;
  ELSE
    v_changes := jsonb_build_object('code', jsonb_build_object('old', OLD.code, 'new', NULL),'name', jsonb_build_object('old', OLD.name, 'new', NULL));
  END IF;
  PERFORM public.log_audit_entry(v_row.organization_id, 'equipment_group', v_row.id, v_row.name, TG_OP, v_changes, jsonb_build_object('group_code', v_row.code));
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_equipment_group_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_inventory_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Determine entity name
  IF TG_OP = 'DELETE' THEN
    v_entity_name := OLD.name;
  ELSE
    v_entity_name := NEW.name;
  END IF;
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', NULL, 'new', NEW.name),
      'sku', jsonb_build_object('old', NULL, 'new', NEW.sku),
      'quantity_on_hand', jsonb_build_object('old', NULL, 'new', NEW.quantity_on_hand),
      'low_stock_threshold', jsonb_build_object('old', NULL, 'new', NEW.low_stock_threshold)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track fields that changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.quantity_on_hand IS DISTINCT FROM NEW.quantity_on_hand THEN
      v_changes := v_changes || jsonb_build_object('quantity_on_hand', jsonb_build_object('old', OLD.quantity_on_hand, 'new', NEW.quantity_on_hand));
    END IF;
    IF OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold THEN
      v_changes := v_changes || jsonb_build_object('low_stock_threshold', jsonb_build_object('old', OLD.low_stock_threshold, 'new', NEW.low_stock_threshold));
    END IF;
    IF OLD.location IS DISTINCT FROM NEW.location THEN
      v_changes := v_changes || jsonb_build_object('location', jsonb_build_object('old', OLD.location, 'new', NEW.location));
    END IF;
    IF OLD.default_unit_cost IS DISTINCT FROM NEW.default_unit_cost THEN
      v_changes := v_changes || jsonb_build_object('default_unit_cost', jsonb_build_object('old', OLD.default_unit_cost, 'new', NEW.default_unit_cost));
    END IF;
    IF OLD.sku IS DISTINCT FROM NEW.sku THEN
      v_changes := v_changes || jsonb_build_object('sku', jsonb_build_object('old', OLD.sku, 'new', NEW.sku));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', OLD.name, 'new', NULL),
      'sku', jsonb_build_object('old', OLD.sku, 'new', NULL)
    );
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    COALESCE(NEW.organization_id, OLD.organization_id),
    'inventory_item',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_inventory_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_org_member_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Get member name from profiles
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(p.name, 'Unknown User') INTO v_entity_name
    FROM public.profiles p
    WHERE p.id = OLD.user_id;
  ELSE
    SELECT COALESCE(p.name, 'Unknown User') INTO v_entity_name
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  
  v_entity_name := COALESCE(v_entity_name, 'Unknown User');
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'role', jsonb_build_object('old', NULL, 'new', NEW.role),
      'status', jsonb_build_object('old', NULL, 'new', NEW.status)
    );
    v_metadata := jsonb_build_object('user_id', NEW.user_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      v_changes := v_changes || jsonb_build_object('role', jsonb_build_object('old', OLD.role, 'new', NEW.role));
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
    v_metadata := jsonb_build_object('user_id', NEW.user_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'role', jsonb_build_object('old', OLD.role, 'new', NULL),
      'status', jsonb_build_object('old', OLD.status, 'new', NULL)
    );
    v_metadata := jsonb_build_object('user_id', OLD.user_id);
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    COALESCE(NEW.organization_id, OLD.organization_id),
    'organization_member',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_org_member_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_pm_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
  v_org_id UUID;
BEGIN
  -- Get organization_id from work_order
  IF TG_OP = 'DELETE' THEN
    SELECT wo.organization_id INTO v_org_id
    FROM public.work_orders wo
    WHERE wo.id = OLD.work_order_id;
    v_entity_name := 'PM for Work Order';
  ELSE
    SELECT wo.organization_id INTO v_org_id
    FROM public.work_orders wo
    WHERE wo.id = NEW.work_order_id;
    v_entity_name := 'PM for Work Order';
  END IF;
  
  -- Skip if we can't determine organization
  IF v_org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'status', jsonb_build_object('old', NULL, 'new', NEW.status),
      'template_id', jsonb_build_object('old', NULL, 'new', NEW.template_id)
    );
    v_metadata := jsonb_build_object('work_order_id', NEW.work_order_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    IF OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
      v_changes := v_changes || jsonb_build_object('completed_at', jsonb_build_object('old', OLD.completed_at, 'new', NEW.completed_at));
    END IF;
    IF OLD.completed_by IS DISTINCT FROM NEW.completed_by THEN
      v_changes := v_changes || jsonb_build_object('completed_by', jsonb_build_object('old', OLD.completed_by, 'new', NEW.completed_by));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
    v_metadata := jsonb_build_object('work_order_id', NEW.work_order_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'status', jsonb_build_object('old', OLD.status, 'new', NULL)
    );
    v_metadata := jsonb_build_object('work_order_id', OLD.work_order_id);
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    v_org_id,
    'preventative_maintenance',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_pm_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_team_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Determine entity name
  IF TG_OP = 'DELETE' THEN
    v_entity_name := OLD.name;
  ELSE
    v_entity_name := NEW.name;
  END IF;
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', NULL, 'new', NEW.name),
      'description', jsonb_build_object('old', NULL, 'new', NEW.description)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'name', jsonb_build_object('old', OLD.name, 'new', NULL)
    );
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    COALESCE(NEW.organization_id, OLD.organization_id),
    'team',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_team_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_team_member_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
  v_org_id UUID;
BEGIN
  -- Get organization_id from team
  IF TG_OP = 'DELETE' THEN
    SELECT t.organization_id INTO v_org_id
    FROM public.teams t
    WHERE t.id = OLD.team_id;
    
    SELECT COALESCE(p.name, 'Unknown User') INTO v_entity_name
    FROM public.profiles p
    WHERE p.id = OLD.user_id;
  ELSE
    SELECT t.organization_id INTO v_org_id
    FROM public.teams t
    WHERE t.id = NEW.team_id;
    
    SELECT COALESCE(p.name, 'Unknown User') INTO v_entity_name
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  
  -- Skip if we can't determine organization
  IF v_org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  v_entity_name := COALESCE(v_entity_name, 'Unknown User');
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'role', jsonb_build_object('old', NULL, 'new', NEW.role)
    );
    v_metadata := jsonb_build_object('team_id', NEW.team_id, 'user_id', NEW.user_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      v_changes := v_changes || jsonb_build_object('role', jsonb_build_object('old', OLD.role, 'new', NEW.role));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
    v_metadata := jsonb_build_object('team_id', NEW.team_id, 'user_id', NEW.user_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'role', jsonb_build_object('old', OLD.role, 'new', NULL)
    );
    v_metadata := jsonb_build_object('team_id', OLD.team_id, 'user_id', OLD.user_id);
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    v_org_id,
    'team_member',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_team_member_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_work_order_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_changes JSONB := '{}';
  v_entity_name TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Determine entity name
  IF TG_OP = 'DELETE' THEN
    v_entity_name := OLD.title;
  ELSE
    v_entity_name := NEW.title;
  END IF;
  
  -- Build changes object based on operation
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'title', jsonb_build_object('old', NULL, 'new', NEW.title),
      'status', jsonb_build_object('old', NULL, 'new', NEW.status),
      'priority', jsonb_build_object('old', NULL, 'new', NEW.priority),
      'equipment_id', jsonb_build_object('old', NULL, 'new', NEW.equipment_id)
    );
    v_metadata := jsonb_build_object(
      'equipment_id', NEW.equipment_id,
      'team_id', NEW.team_id,
      'created_by', NEW.created_by
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track fields that changed
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority));
    END IF;
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      v_changes := v_changes || jsonb_build_object('assignee_id', jsonb_build_object('old', OLD.assignee_id, 'new', NEW.assignee_id));
      v_changes := v_changes || jsonb_build_object('assignee_name', jsonb_build_object('old', OLD.assignee_name, 'new', NEW.assignee_name));
    END IF;
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      v_changes := v_changes || jsonb_build_object('due_date', jsonb_build_object('old', OLD.due_date, 'new', NEW.due_date));
    END IF;
    IF OLD.completed_date IS DISTINCT FROM NEW.completed_date THEN
      v_changes := v_changes || jsonb_build_object('completed_date', jsonb_build_object('old', OLD.completed_date, 'new', NEW.completed_date));
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
    END IF;
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      v_changes := v_changes || jsonb_build_object('team_id', jsonb_build_object('old', OLD.team_id, 'new', NEW.team_id));
    END IF;
    IF OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
      v_changes := v_changes || jsonb_build_object('estimated_hours', jsonb_build_object('old', OLD.estimated_hours, 'new', NEW.estimated_hours));
    END IF;
    
    -- Skip if no tracked fields changed
    IF v_changes = '{}'::JSONB THEN
      RETURN NEW;
    END IF;
    
    v_metadata := jsonb_build_object('equipment_id', NEW.equipment_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object(
      'title', jsonb_build_object('old', OLD.title, 'new', NULL),
      'status', jsonb_build_object('old', OLD.status, 'new', NULL)
    );
  END IF;
  
  -- Log the audit entry
  PERFORM public.log_audit_entry(
    COALESCE(NEW.organization_id, OLD.organization_id),
    'work_order',
    COALESCE(NEW.id, OLD.id),
    v_entity_name,
    TG_OP,
    v_changes,
    v_metadata
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_work_order_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_provision_workspace_organization"("p_user_id" "uuid", "p_domain" "text", "p_organization_name" "text") RETURNS TABLE("organization_id" "uuid", "domain" "text", "already_existed" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_domain text;
  v_org_id uuid;
  v_existing_org_id uuid;
BEGIN
  v_domain := public.normalize_domain(p_domain);

  IF v_domain IN ('gmail.com', 'googlemail.com') THEN
    RAISE EXCEPTION 'Consumer domains are not supported';
  END IF;

  SELECT d.organization_id INTO v_existing_org_id
  FROM public.workspace_domains d
  WHERE public.normalize_domain(d.domain) = v_domain;

  IF v_existing_org_id IS NOT NULL THEN
    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT o.id INTO v_existing_org_id
  FROM public.organizations o
  JOIN public.organization_members om ON om.organization_id = o.id
  LEFT JOIN public.personal_organizations po ON po.organization_id = o.id
  WHERE om.user_id = p_user_id
    AND om.role = 'owner'
    AND om.status = 'active'
    AND po.organization_id IS NULL
  ORDER BY o.created_at ASC
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    INSERT INTO public.workspace_domains (domain, organization_id)
    VALUES (v_domain, v_existing_org_id)
    ON CONFLICT (domain) DO NOTHING;

    IF NOT FOUND THEN
      SELECT d.organization_id INTO v_existing_org_id
      FROM public.workspace_domains d
      WHERE public.normalize_domain(d.domain) = v_domain;
    END IF;

    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.organizations (name, plan, member_count, max_members, features)
  VALUES (
    p_organization_name,
    'free',
    1,
    5,
    ARRAY['Equipment Management', 'Work Orders', 'Team Management']
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status, access_source)
  VALUES (v_org_id, p_user_id, 'owner', 'active', 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.workspace_domains (domain, organization_id)
  VALUES (v_domain, v_org_id)
  ON CONFLICT (domain) DO NOTHING;

  SELECT d.organization_id INTO v_existing_org_id
  FROM public.workspace_domains d
  WHERE public.normalize_domain(d.domain) = v_domain;

  IF v_existing_org_id IS NOT NULL AND v_existing_org_id <> v_org_id THEN
    DELETE FROM public.organization_members
    WHERE organization_id = v_org_id;

    DELETE FROM public.organizations
    WHERE id = v_org_id;

    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  organization_id := v_org_id;
  domain := v_domain;
  already_existed := false;
  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."auto_provision_workspace_organization"("p_user_id" "uuid", "p_domain" "text", "p_organization_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_provision_workspace_organization"("p_user_id" "uuid", "p_domain" "text", "p_organization_name" "text") IS 'Atomically provisions or reuses an owner-managed organization for a Workspace domain without migrating same-domain users by default.';



CREATE OR REPLACE FUNCTION "public"."backfill_user_profile_and_org"("user_id_val" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_email_val text;
  user_name_val text;
  org_name_val text;
  new_org_id uuid;
  result jsonb;
BEGIN
  -- Get user data from auth.users
  SELECT email, 
         COALESCE(raw_user_meta_data->>'name', email),
         COALESCE(raw_user_meta_data->>'organization_name', 'My Organization')
  INTO user_email_val, user_name_val, org_name_val
  FROM auth.users
  WHERE id = user_id_val;

  -- Check if user exists
  IF user_email_val IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users', user_id_val;
  END IF;

  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (id, email, name)
  VALUES (user_id_val, user_email_val, user_name_val)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name);

  -- Check if user already has an organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = user_id_val AND status = 'active'
  ) THEN
    -- Create organization
    INSERT INTO public.organizations (name, plan, member_count, max_members, features)
    VALUES (
      org_name_val,
      'free',
      1,
      5,
      ARRAY['Equipment Management', 'Work Orders', 'Team Management']
    )
    RETURNING id INTO new_org_id;

    -- Add user as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, user_id_val, 'owner', 'active')
    ON CONFLICT DO NOTHING;

    result := jsonb_build_object(
      'success', true,
      'user_id', user_id_val,
      'organization_id', new_org_id,
      'message', 'Created profile and organization for user'
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'user_id', user_id_val,
      'message', 'Profile created/updated, user already has organization membership'
    );
  END IF;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."backfill_user_profile_and_org"("user_id_val" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_user_profile_and_org"("user_id_val" "uuid") IS 'Backfills missing profile and organization data for a user. Used to fix users created before the auth.users trigger was in place.';



CREATE OR REPLACE FUNCTION "public"."broadcast_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- ===========================================================================
  -- PART A: Realtime broadcast (online/connected users) - UNCHANGED
  -- ===========================================================================
  -- Broadcast a lightweight signal to the user's private channel; clients
  -- refetch the full notification data on receipt to keep payloads small.
  PERFORM realtime.send(
    jsonb_build_object(
      'notification_id', NEW.id,
      'type', NEW.type,
      'title', NEW.title,
      'is_global', NEW.is_global,
      'created_at', NEW.created_at
    ),
    'new_notification',
    'notifications:user:' || NEW.user_id::text,
    true
  );

  -- ===========================================================================
  -- PART B: Push notification enqueue (offline/background users) - REWRITTEN
  -- ===========================================================================
  -- Replaces the prior fire-and-forget net.http_post call to
  -- send-push-notification with a durable enqueue into pgmq. The cron-driven
  -- queue-worker Edge Function (see 20260503140000_schedule_queue_worker.sql)
  -- drains the queue every minute and invokes send-push-notification per
  -- message. Failed deliveries are retried automatically via pgmq's vt.
  --
  -- Payload schema is identical to what the prior pg_net call sent, so
  -- send-push-notification's request handler does not need any changes.
  BEGIN
    PERFORM pgmq_public.send(
      'notifications',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.message,
        'data', jsonb_build_object(
          'notification_id', NEW.id,
          'type', NEW.type,
          'work_order_id', NEW.data->>'work_order_id',
          'organization_id', NEW.organization_id
        ),
        'url', CASE
          WHEN NEW.data->>'work_order_id' IS NOT NULL
          THEN '/dashboard/work-orders/' || (NEW.data->>'work_order_id')
          ELSE '/dashboard/notifications'
        END
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- pgmq enqueue errors should not block the notification insert.
    -- Common causes: pgmq extension not enabled, queue not yet created.
    -- Realtime delivery (PART A) already ran, so connected clients still
    -- see the notification; offline/background users will miss this one
    -- specific event but the next event recovers automatically once pgmq
    -- is healthy. This degraded-mode behavior is intentional per the
    -- Risk & Impact Analysis on the Change Record.
    RAISE WARNING 'pgmq enqueue failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Outer guard: never block the notification insert. The notification row
  -- is what users care about; broadcast/push are best-effort.
  RAISE WARNING 'broadcast_notification failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_notification"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."broadcast_notification"() IS 'Trigger function fired on AFTER INSERT ON public.notifications. Broadcasts a real-time signal via realtime.send for online users AND enqueues a durable message into the pgmq notifications queue for offline/background push delivery. The queue-worker Edge Function (cron-driven) drains the queue and invokes send-push-notification. Replaces the prior fire-and-forget net.http_post pattern with durable retry semantics. See migration 20260503150000 and Change Record on issue #722.';



CREATE OR REPLACE FUNCTION "public"."broadcast_ticket_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the ticket owner
  SELECT user_id INTO v_user_id FROM public.tickets WHERE id = NEW.ticket_id;
  IF v_user_id IS NOT NULL THEN
    PERFORM realtime.send(
      jsonb_build_object('ticket_id', NEW.ticket_id, 'comment_id', NEW.id),
      'ticket_update',
      'tickets:user:' || v_user_id::text,
      true
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_ticket_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."broadcast_ticket_status_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    PERFORM realtime.send(
      jsonb_build_object('ticket_id', NEW.id, 'status', NEW.status),
      'ticket_update',
      'tickets:user:' || NEW.user_id::text,
      true
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_ticket_status_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rules_count INTEGER := 0;
  v_rule JSONB;
  v_manufacturer TEXT;
  v_model TEXT;
  v_manufacturer_norm TEXT;
  v_model_norm TEXT;
  v_match_type public.model_match_type;
  v_pattern_raw TEXT;
  v_pattern_norm TEXT;
  v_status public.verification_status;
  v_notes TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no authenticated user context'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.can_manage_inventory(p_organization_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: user cannot manage inventory for this organization'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_items
    WHERE id = p_item_id
      AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Inventory item not found or access denied'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.part_compatibility_rules
  WHERE inventory_item_id = p_item_id;

  IF p_rules IS NOT NULL AND jsonb_array_length(p_rules) > 0 THEN
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
      v_manufacturer := v_rule->>'manufacturer';
      v_model := v_rule->>'model';

      IF v_manufacturer IS NOT NULL AND trim(v_manufacturer) <> '' THEN
        v_manufacturer_norm := lower(trim(v_manufacturer));

        BEGIN
          v_match_type := COALESCE(
            (v_rule->>'match_type')::public.model_match_type,
            CASE
              WHEN v_model IS NULL OR trim(v_model) = '' THEN 'any'::public.model_match_type
              ELSE 'exact'::public.model_match_type
            END
          );
        EXCEPTION WHEN invalid_text_representation THEN
          v_match_type := 'exact'::public.model_match_type;
        END;

        IF v_match_type = 'any'::public.model_match_type THEN
          v_model_norm := NULL;
          v_pattern_raw := NULL;
          v_pattern_norm := NULL;
        ELSIF v_match_type = 'prefix'::public.model_match_type THEN
          v_pattern_raw := trim(v_model);
          v_pattern_norm := lower(v_pattern_raw);
          v_model_norm := v_pattern_norm;
        ELSIF v_match_type = 'wildcard'::public.model_match_type THEN
          v_pattern_raw := trim(v_model);
          v_pattern_norm := lower(replace(v_pattern_raw, '*', '%'));
          v_model_norm := NULL;
        ELSE
          v_model_norm := lower(trim(v_model));
          v_pattern_raw := NULL;
          v_pattern_norm := NULL;
        END IF;

        v_status := COALESCE((v_rule->>'status')::public.verification_status, 'unverified'::public.verification_status);
        v_notes := v_rule->>'notes';

        INSERT INTO public.part_compatibility_rules (
          inventory_item_id,
          manufacturer,
          model,
          manufacturer_norm,
          model_norm,
          match_type,
          model_pattern_raw,
          model_pattern_norm,
          status,
          notes,
          created_by
        )
        SELECT
          p_item_id,
          trim(v_manufacturer),
          NULLIF(trim(v_model), ''),
          v_manufacturer_norm,
          v_model_norm,
          v_match_type,
          v_pattern_raw,
          v_pattern_norm,
          v_status,
          v_notes,
          auth.uid()
        WHERE NOT EXISTS (
          SELECT 1 FROM public.part_compatibility_rules pcr
          WHERE pcr.inventory_item_id = p_item_id
            AND pcr.manufacturer_norm = v_manufacturer_norm
            AND (
              (pcr.model_norm IS NULL AND v_model_norm IS NULL)
              OR pcr.model_norm = v_model_norm
            )
        );

        IF FOUND THEN
          v_rules_count := v_rules_count + 1;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN v_rules_count;
END;
$$;


ALTER FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") IS 'Atomically replaces all compatibility rules for an inventory item. Supports match_type: any, exact, prefix, wildcard. Uses NOT EXISTS pattern to work with partial unique indexes. Uses a single transaction to ensure delete and insert are atomic.';



CREATE OR REPLACE FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_rules_count INTEGER := 0;
  v_rule JSONB;
  v_manufacturer TEXT;
  v_model TEXT;
  v_manufacturer_norm TEXT;
  v_model_norm TEXT;
BEGIN
  -- Security check: Verify authenticated context exists
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: no authenticated user context'
      USING ERRCODE = '42501';
  END IF;

  -- Security check: Verify the calling user is an active member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not an active member of the organization'
      USING ERRCODE = '42501';
  END IF;

  -- Verify the PM template is accessible (global or org-owned)
  IF NOT EXISTS (
    SELECT 1 FROM public.pm_checklist_templates
    WHERE id = p_template_id
      AND (organization_id IS NULL OR organization_id = p_organization_id)
  ) THEN
    RAISE EXCEPTION 'PM template not found or access denied'
      USING ERRCODE = '42501';
  END IF;

  -- Delete all existing rules for this template AND organization (within the transaction)
  DELETE FROM public.pm_template_compatibility_rules
  WHERE pm_template_id = p_template_id
    AND organization_id = p_organization_id;

  -- Insert new rules from the JSONB array
  -- If this fails, the entire transaction (including the delete) rolls back
  IF p_rules IS NOT NULL AND jsonb_array_length(p_rules) > 0 THEN
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
      v_manufacturer := v_rule->>'manufacturer';
      v_model := v_rule->>'model';
      
      -- Skip rules with empty manufacturer
      IF v_manufacturer IS NOT NULL AND trim(v_manufacturer) <> '' THEN
        v_manufacturer_norm := lower(trim(v_manufacturer));
        v_model_norm := CASE 
          WHEN v_model IS NOT NULL AND trim(v_model) <> '' THEN lower(trim(v_model))
          ELSE NULL
        END;
        
        -- Insert with ON CONFLICT DO NOTHING to handle duplicates silently
        INSERT INTO public.pm_template_compatibility_rules (
          pm_template_id,
          organization_id,
          manufacturer,
          model,
          manufacturer_norm,
          model_norm
        ) VALUES (
          p_template_id,
          p_organization_id,
          trim(v_manufacturer),
          CASE WHEN v_model IS NOT NULL AND trim(v_model) <> '' THEN trim(v_model) ELSE NULL END,
          v_manufacturer_norm,
          v_model_norm
        )
        ON CONFLICT (pm_template_id, organization_id, manufacturer_norm, model_norm) DO NOTHING;
        
        -- Only count if actually inserted (no conflict)
        IF FOUND THEN
          v_rules_count := v_rules_count + 1;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN v_rules_count;
END;
$$;


ALTER FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") IS 'Atomically replaces all compatibility rules for a PM template within an organization. Uses a single transaction to ensure delete and insert are atomic. Works for both global templates and org-owned templates.';



CREATE OR REPLACE FUNCTION "public"."calculate_billable_members"("org_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.organization_members om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE om.organization_id = org_id 
    AND om.status = 'active'
    AND om.role IN ('admin', 'member'); -- Exclude owners from billing
$$;


ALTER FUNCTION "public"."calculate_billable_members"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_organization_billing"("org_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  active_users INTEGER;
  storage_mb INTEGER;
  result jsonb;
BEGIN
  -- Get active user count (excluding owners)
  SELECT COUNT(*)::INTEGER INTO active_users
  FROM public.organization_members om
  JOIN public.profiles p ON om.user_id = p.id
  WHERE om.organization_id = org_id 
    AND om.status = 'active'
    AND om.role IN ('admin', 'member');

  -- Get storage usage
  SELECT COALESCE(storage_used_mb, 0)::INTEGER INTO storage_mb
  FROM public.organizations
  WHERE id = org_id;

  -- Build result JSON
  result := jsonb_build_object(
    'organization_id', org_id,
    'active_users', active_users,
    'storage_mb', storage_mb,
    'user_license_cost', active_users * 1000, -- $10.00 per user in cents
    'storage_overage_cost', GREATEST(0, storage_mb - 1000) * 10, -- $0.10 per MB over 1GB
    'calculated_at', now()
  );

  RETURN result;
END;
$_$;


ALTER FUNCTION "public"."calculate_organization_billing"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id
    AND status = 'active';

  IF v_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;

  IF public.is_parts_manager(p_organization_id, p_user_id) THEN
    RETURN TRUE;
  END IF;

  RETURN public.is_parts_consumer(p_organization_id, p_user_id);
END;
$$;


ALTER FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") IS 'Returns TRUE when the user may view inventory, alternate groups, and part lookup for the organization.';



CREATE OR REPLACE FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = p_work_order_id
      AND (
        public.is_org_admin(p_user_id, wo.organization_id)
        OR (
          public.is_org_member(p_user_id, wo.organization_id)
          AND (
            wo.assignee_id = p_user_id
            OR (
              wo.team_id IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM public.team_members tm
                WHERE tm.team_id = wo.team_id
                  AND tm.user_id = p_user_id
                  AND tm.role::text IN ('owner', 'manager', 'technician')
              )
            )
          )
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid") IS 'True when the user may see or manage cost line items (parts, pricing, labor) for the work order: org owner/admin, the work order assignee, or team owner/manager/technician on the work order''s team. Team requestors/viewers and plain org members are denied — customer-facing roles must stay oblivious to internal costing.';



CREATE OR REPLACE FUNCTION "public"."can_edit_equipment_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_note public.equipment_notes%ROWTYPE;
  v_window_hours integer;
BEGIN
  SELECT en.* INTO v_note
  FROM public.equipment_notes en
  JOIN public.equipment e ON e.id = en.equipment_id
  WHERE en.id = p_note_id
    AND en.equipment_id = p_equipment_id
    AND e.organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF public.is_org_admin(p_user_id, p_organization_id)
     OR public.is_equipment_team_manager(p_user_id, p_equipment_id) THEN
    RETURN true;
  END IF;

  IF v_note.author_id IS DISTINCT FROM p_user_id THEN
    RETURN false;
  END IF;

  SELECT COALESCE(o.note_author_edit_window_hours, 24)
  INTO v_window_hours
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  RETURN v_note.created_at + make_interval(hours => v_window_hours) >= now();
END;
$$;


ALTER FUNCTION "public"."can_edit_equipment_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_work_order_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_note public.work_order_notes%ROWTYPE;
  v_window_hours integer;
BEGIN
  SELECT won.* INTO v_note
  FROM public.work_order_notes won
  JOIN public.work_orders wo ON wo.id = won.work_order_id
  WHERE won.id = p_note_id
    AND won.work_order_id = p_work_order_id
    AND wo.organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF public.is_org_admin(p_user_id, p_organization_id)
     OR public.is_work_order_team_manager(p_user_id, p_work_order_id) THEN
    RETURN true;
  END IF;

  IF v_note.author_id IS DISTINCT FROM p_user_id THEN
    RETURN false;
  END IF;

  SELECT COALESCE(o.note_author_edit_window_hours, 24)
  INTO v_window_hours
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  RETURN v_note.created_at + make_interval(hours => v_window_hours) >= now();
END;
$$;


ALTER FUNCTION "public"."can_edit_work_order_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check organization role
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_organization_id
  AND user_id = p_user_id
  AND status = 'active';
  
  -- Owners and admins can always manage inventory
  IF v_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a parts manager
  RETURN public.is_parts_manager(p_organization_id, p_user_id);
END;
$$;


ALTER FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") IS 'Checks if a user can manage inventory for the given organization. Returns TRUE for owners, admins, and parts managers.';



CREATE OR REPLACE FUNCTION "public"."can_manage_invitation_atomic"("user_uuid" "uuid", "invitation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  org_id uuid;
  invited_by_user uuid;
  is_admin_result boolean := false;
BEGIN
  -- Get invitation details
  SELECT organization_id, invited_by 
  INTO org_id, invited_by_user
  FROM organization_invitations
  WHERE id = invitation_id;
  
  -- If user created the invitation, they can manage it
  IF invited_by_user = user_uuid THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin
  IF org_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM organization_members
      WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    ) INTO is_admin_result;
    
    RETURN is_admin_result;
  END IF;
  
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_manage_invitation_atomic"("user_uuid" "uuid", "invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_invitation_optimized"("user_uuid" "uuid", "invitation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  org_id uuid;
  invited_by_user uuid;
  is_admin_result boolean := false;
BEGIN
  -- Get invitation details
  SELECT organization_id, invited_by 
  INTO org_id, invited_by_user
  FROM organization_invitations
  WHERE id = invitation_id;
  
  -- If user created the invitation, they can manage it
  IF invited_by_user = user_uuid THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin
  IF org_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM organization_members
      WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    ) INTO is_admin_result;
    
    RETURN is_admin_result;
  END IF;
  
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_manage_invitation_optimized"("user_uuid" "uuid", "invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_invitation_safe"("user_uuid" "uuid", "invitation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  org_id uuid;
  is_admin boolean := false;
  is_inviter boolean := false;
BEGIN
  SELECT organization_id, (invited_by = user_uuid) 
  INTO org_id, is_inviter
  FROM organization_invitations
  WHERE id = invitation_id;
  
  IF is_inviter THEN
    RETURN true;
  END IF;
  
  IF org_id IS NOT NULL THEN
    SELECT public.check_admin_bypass_fixed(user_uuid, org_id) INTO is_admin;
    RETURN is_admin;
  END IF;
  
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_manage_invitation_safe"("user_uuid" "uuid", "invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = p_customer_id
      AND c.organization_id = p_organization_id
      AND (
        public.is_org_admin((SELECT auth.uid()), c.organization_id)
        OR EXISTS (
          SELECT 1
          FROM public.teams t
          JOIN public.team_members tm ON tm.team_id = t.id
          WHERE t.customer_id = c.id
            AND t.organization_id = c.organization_id
            AND tm.user_id = (SELECT auth.uid())
            AND tm.role = 'manager'::public.team_member_role
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_manage_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role TEXT;
  v_can_manage BOOLEAN;
BEGIN
  -- Get user's membership info
  SELECT role, can_manage_quickbooks
  INTO v_role, v_can_manage
  FROM public.organization_members
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND status = 'active';

  -- No membership found
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owners always have permission
  IF v_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Admins need explicit permission
  IF v_role = 'admin' AND v_can_manage = true THEN
    RETURN true;
  END IF;

  -- Members and admins without explicit permission cannot manage QuickBooks
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") IS 'Checks if a user can manage QuickBooks for an organization. Owners always can. Admins only if can_manage_quickbooks flag is true.';



CREATE OR REPLACE FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_transfer RECORD;
  v_current_user_id UUID;
  v_org_name TEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get transfer request
  SELECT * INTO v_transfer
  FROM ownership_transfer_requests
  WHERE id = p_transfer_id;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer request not found');
  END IF;
  
  -- Validate caller is the initiator (from_user)
  IF v_transfer.from_user_id != v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the initiator can cancel this transfer request');
  END IF;
  
  -- Validate request is still pending
  IF v_transfer.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This transfer request has already been processed');
  END IF;
  
  -- Get organization name
  SELECT name INTO v_org_name
  FROM organizations WHERE id = v_transfer.organization_id;
  
  -- Cancel the transfer
  UPDATE ownership_transfer_requests
  SET status = 'cancelled', responded_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Notify target user (GLOBAL - visible across all orgs)
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    data,
    is_global
  ) VALUES (
    v_transfer.organization_id,
    v_transfer.to_user_id,
    'ownership_transfer_cancelled',
    'Ownership Transfer Cancelled',
    v_transfer.from_user_name || ' has cancelled the ownership transfer request for ' || v_org_name || '.',
    jsonb_build_object(
      'transfer_id', p_transfer_id,
      'organization_id', v_transfer.organization_id,
      'organization_name', v_org_name
    ),
    true  -- Mark as global notification
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transfer request cancelled'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") IS 'Cancel a pending ownership transfer request. Only the initiator can call this.';



CREATE OR REPLACE FUNCTION "public"."check_admin_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Direct query without RLS interference
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_admin_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_permission_safe"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Use the raw bypass function
  SELECT public.raw_check_admin_bypass(user_uuid, org_id) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return false on any error
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_admin_permission_safe"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_with_context"("user_uuid" "uuid", "org_id" "uuid", "bypass_context" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result boolean := false;
  current_context text;
BEGIN
  -- Get the current context from session variable
  current_context := current_setting('app.rls_context', true);
  
  -- If we're in a bypass context (like invitation creation), use direct query
  IF current_context = 'invitation_bypass' OR bypass_context = 'invitation_bypass' THEN
    -- Direct query without RLS interference for invitation context
    SELECT EXISTS (
      SELECT 1 
      FROM organization_members
      WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    ) INTO result;
  ELSE
    -- Normal RLS-aware query for regular contexts
    SELECT EXISTS (
      SELECT 1 
      FROM organization_members
      WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
        AND status = 'active'
        AND user_id = auth.uid() -- Only check for current user in normal context
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_admin_with_context"("user_uuid" "uuid", "org_id" "uuid", "bypass_context" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_email_exists_in_auth"("p_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  email_exists boolean := false;
BEGIN
  -- Check if email exists in auth.users table
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE lower(trim(email)) = lower(trim(p_email))
  ) INTO email_exists;
  
  RETURN email_exists;
EXCEPTION WHEN OTHERS THEN
  -- Return true on error to be safe (don't create account if we can't verify)
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_email_exists_in_auth"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_minute_count INTEGER;
  v_hour_count INTEGER;
BEGIN
  -- Check exports by this user in the last minute (max 5)
  SELECT COUNT(*) INTO v_minute_count
  FROM public.export_request_log
  WHERE user_id = p_user_id
    AND requested_at > NOW() - INTERVAL '1 minute';
  
  IF v_minute_count >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Check exports by this organization in the last hour (max 50)
  SELECT COUNT(*) INTO v_hour_count
  FROM public.export_request_log
  WHERE organization_id = p_organization_id
    AND requested_at > NOW() - INTERVAL '1 hour';
  
  IF v_hour_count >= 50 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") IS 'Checks if a user/organization has exceeded export rate limits. Returns TRUE if export is allowed, FALSE if rate limited. Limits: 5 exports per user per minute, 50 exports per org per hour.';



CREATE OR REPLACE FUNCTION "public"."check_member_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Direct query without RLS interference
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND status = 'active'
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_member_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_org_access_direct"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND status = 'active'
  );
$$;


ALTER FUNCTION "public"."check_org_access_direct"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_org_access_secure"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND status = 'active'
  );
$$;


ALTER FUNCTION "public"."check_org_access_secure"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_org_admin_secure"("user_uuid" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$;


ALTER FUNCTION "public"."check_org_admin_secure"("user_uuid" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric DEFAULT 5) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  current_storage_mb BIGINT;
  current_storage_gb NUMERIC;
  file_size_mb NUMERIC;
  would_exceed BOOLEAN;
  remaining_gb NUMERIC;
  result JSONB;
BEGIN
  -- Get current storage
  current_storage_mb := get_organization_storage_mb(org_id);
  current_storage_gb := current_storage_mb / 1024.0;
  file_size_mb := file_size_bytes / 1048576.0;
  
  -- Check if adding this file would exceed limit
  would_exceed := (current_storage_gb + (file_size_mb / 1024.0)) > max_storage_gb;
  remaining_gb := GREATEST(0, max_storage_gb - current_storage_gb);
  
  result := jsonb_build_object(
    'can_upload', NOT would_exceed,
    'current_storage_gb', ROUND(current_storage_gb, 2),
    'max_storage_gb', max_storage_gb,
    'file_size_mb', ROUND(file_size_mb, 2),
    'would_exceed', would_exceed,
    'remaining_gb', ROUND(remaining_gb, 2),
    'usage_percent', ROUND((current_storage_gb / max_storage_gb * 100)::numeric, 1)
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric) IS 'Check if organization has storage space for a file. Returns JSON with quota info. Limit: 5GB by default. Created 2025-01-28.';



CREATE OR REPLACE FUNCTION "public"."check_team_access_secure"("user_uuid" "uuid", "team_uuid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = user_uuid 
      AND tm.team_id = team_uuid
  );
$$;


ALTER FUNCTION "public"."check_team_access_secure"("user_uuid" "uuid", "team_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_team_role_secure"("user_uuid" "uuid", "team_uuid" "uuid", "required_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = user_uuid 
      AND tm.team_id = team_uuid
      AND tm.role::text = required_role
  );
$$;


ALTER FUNCTION "public"."check_team_role_secure"("user_uuid" "uuid", "team_uuid" "uuid", "required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_quickbooks_invoice_status_events"("p_batch_size" integer) RETURNS TABLE("id" "uuid", "organization_id" "uuid", "realm_id" "text", "entity_name" "text", "entity_id" "text", "operation" "text", "attempts" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  WITH picked AS (
    SELECT e.id
    FROM public.quickbooks_invoice_status_events e
    WHERE e.attempts < 5
      AND (
        e.status IN ('pending', 'error')
        OR (
          e.status = 'processing'
          AND e.updated_at < now() - interval '15 minutes'
        )
      )
    ORDER BY e.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_batch_size, 0), 1), 500)
  )
  UPDATE public.quickbooks_invoice_status_events u
  SET
    status = 'processing',
    attempts = u.attempts + 1,
    last_error = NULL
  FROM picked p
  WHERE u.id = p.id
  RETURNING
    u.id,
    u.organization_id,
    u.realm_id,
    u.entity_name,
    u.entity_id,
    u.operation,
    u.attempts;
$$;


ALTER FUNCTION "public"."claim_quickbooks_invoice_status_events"("p_batch_size" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."claim_quickbooks_invoice_status_events"("p_batch_size" integer) IS 'SECURITY DEFINER with SET search_path = empty string for search_path hardening. Claim RPC behavior is defined by the latest applied claim migration. Callable only by service_role.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_export_results"("p_retention_days" integer DEFAULT 7) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.export_request_log
  SET
    result_url = NULL,
    result_storage_path = NULL
  WHERE job_mode = 'async'
    AND delivery = 'storage'
    AND completed_at IS NOT NULL
    AND completed_at < (now() - make_interval(days => GREATEST(p_retention_days, 1)))
    AND result_storage_path IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_export_results"("p_retention_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_gws_oauth_sessions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rows integer;
BEGIN
  DELETE FROM public.google_workspace_oauth_sessions
  WHERE expires_at < (now() - interval '1 day');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_gws_oauth_sessions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_gws_oauth_sessions"() IS 'Deletes expired Google Workspace OAuth CSRF sessions older than 1 day.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_invitations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rows integer;
BEGIN
  DELETE FROM public.organization_invitations
  WHERE status IN ('expired', 'declined')
    AND COALESCE(expired_at, created_at) < (now() - interval '30 days');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_invitations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_invitations"() IS 'Deletes expired or declined invitation records older than 30 days. Minimizes retention of invitee email addresses per data minimization principles.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_quickbooks_oauth_sessions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.quickbooks_oauth_sessions
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_quickbooks_oauth_sessions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_quickbooks_oauth_sessions"() IS 'Cleans up expired OAuth sessions older than 24 hours. Can be called periodically.';



CREATE OR REPLACE FUNCTION "public"."cleanup_inventory_grants_on_member_removal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.parts_consumers
  WHERE organization_id = OLD.organization_id
    AND user_id = OLD.user_id;

  DELETE FROM public.parts_managers
  WHERE organization_id = OLD.organization_id
    AND user_id = OLD.user_id;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."cleanup_inventory_grants_on_member_removal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_departure_queue"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rows integer;
BEGIN
  DELETE FROM public.user_departure_queue
  WHERE status IN ('completed', 'failed')
    AND created_at < (now() - interval '90 days');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_departure_queue"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_departure_queue"() IS 'Removes completed or failed user departure queue entries older than 90 days.';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_export_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.export_request_log
  WHERE requested_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_export_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_export_logs"() IS 'Removes export log entries older than 90 days. Run periodically via cron.';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < (now() - interval '30 days');
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_notifications"() IS 'Cleans up notifications older than 30 days.';



CREATE OR REPLACE FUNCTION "public"."cleanup_stale_gws_directory_users"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_rows integer;
BEGIN
  DELETE FROM public.google_workspace_directory_users
  WHERE last_synced_at < (now() - interval '30 days');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;


ALTER FUNCTION "public"."cleanup_stale_gws_directory_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_stale_gws_directory_users"() IS 'Removes Google Workspace directory user records that have not been refreshed in the last 30 days. Stale entries likely represent departed employees.';



CREATE OR REPLACE FUNCTION "public"."clear_rls_context"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM set_config('app.rls_context', '', true);
END;
$$;


ALTER FUNCTION "public"."clear_rls_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.organization_members om
  SET product_onboarding_completed_at = COALESCE(om.product_onboarding_completed_at, NOW())
  WHERE om.organization_id = p_organization_id
    AND om.user_id = v_user_id
    AND om.status = 'active'
    AND om.role IN ('owner', 'admin');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Only active organization owners or admins can complete product onboarding';
  END IF;
END;
$$;


ALTER FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") IS 'Marks product onboarding complete for the current user in the given organization. Idempotent.';



CREATE OR REPLACE FUNCTION "public"."convert_work_order_to_historical"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_work_order public.work_orders%ROWTYPE;
  v_replace_result jsonb;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization is required');
  END IF;

  IF p_events IS NULL OR jsonb_typeof(p_events) <> 'array' OR jsonb_array_length(p_events) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Timeline events are required');
  END IF;

  SELECT *
  INTO v_work_order
  FROM public.work_orders
  WHERE id = p_work_order_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work order not found');
  END IF;

  IF NOT public.is_org_admin(auth.uid(), v_work_order.organization_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;…181724 tokens truncated…storage_metadata"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_account_deletion_storage_metadata"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."apply_pending_admin_grants_for_user"("p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assert_inventory_read_access"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assert_inventory_read_access"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."assert_inventory_read_access"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assign_equipment_management_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_equipment_management_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_equipment_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_equipment_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_equipment_classification_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_equipment_classification_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_equipment_group_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_equipment_group_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_inventory_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_inventory_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_org_member_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_org_member_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_pm_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_pm_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_team_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_team_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_team_member_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_team_member_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_work_order_changes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_work_order_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."auto_provision_workspace_organization"("p_user_id" "uuid", "p_domain" "text", "p_organization_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auto_provision_workspace_organization"("p_user_id" "uuid", "p_domain" "text", "p_organization_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_user_profile_and_org"("user_id_val" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_user_profile_and_org"("user_id_val" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."broadcast_notification"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."broadcast_notification"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."broadcast_ticket_comment"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."broadcast_ticket_comment"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."broadcast_ticket_status_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."broadcast_ticket_status_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."bulk_set_compatibility_rules"("p_organization_id" "uuid", "p_item_id" "uuid", "p_rules" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."bulk_set_pm_template_rules"("p_organization_id" "uuid", "p_template_id" "uuid", "p_rules" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."calculate_billable_members"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_billable_members"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."calculate_organization_billing"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_organization_billing"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_access_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_access_work_order_costs"("p_work_order_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_edit_equipment_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_edit_equipment_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_edit_work_order_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_edit_work_order_note"("p_user_id" "uuid", "p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_manage_inventory"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_manage_invitation_atomic"("user_uuid" "uuid", "invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_invitation_atomic"("user_uuid" "uuid", "invitation_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_manage_invitation_atomic"("user_uuid" "uuid", "invitation_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_manage_invitation_optimized"("user_uuid" "uuid", "invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_invitation_optimized"("user_uuid" "uuid", "invitation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_manage_invitation_safe"("user_uuid" "uuid", "invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_invitation_safe"("user_uuid" "uuid", "invitation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_manage_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_manage_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_user_manage_quickbooks"("p_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."cancel_ownership_transfer"("p_transfer_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_admin_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_admin_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_admin_permission_safe"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_admin_permission_safe"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."check_admin_permission_safe"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_admin_with_context"("user_uuid" "uuid", "org_id" "uuid", "bypass_context" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_admin_with_context"("user_uuid" "uuid", "org_id" "uuid", "bypass_context" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_email_exists_in_auth"("p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_email_exists_in_auth"("p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."check_export_rate_limit"("p_user_id" "uuid", "p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_member_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_member_bypass_fixed"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_org_access_direct"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_org_access_direct"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_org_access_secure"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_org_access_secure"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."check_org_access_secure"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_org_admin_secure"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_org_admin_secure"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric) TO "service_role";
GRANT ALL ON FUNCTION "public"."check_storage_limit"("org_id" "uuid", "file_size_bytes" bigint, "max_storage_gb" numeric) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."check_team_access_secure"("user_uuid" "uuid", "team_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_team_access_secure"("user_uuid" "uuid", "team_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_team_role_secure"("user_uuid" "uuid", "team_uuid" "uuid", "required_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_team_role_secure"("user_uuid" "uuid", "team_uuid" "uuid", "required_role" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_quickbooks_invoice_status_events"("p_batch_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_quickbooks_invoice_status_events"("p_batch_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_export_results"("p_retention_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_export_results"("p_retention_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_gws_oauth_sessions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_gws_oauth_sessions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_invitations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_quickbooks_oauth_sessions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_quickbooks_oauth_sessions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_inventory_grants_on_member_removal"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_inventory_grants_on_member_removal"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_departure_queue"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_departure_queue"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_export_logs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_export_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_notifications"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_stale_gws_directory_users"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_stale_gws_directory_users"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."clear_rls_context"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clear_rls_context"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."complete_product_onboarding"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."convert_work_order_to_historical"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."convert_work_order_to_historical"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."convert_work_order_to_historical"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."count_equipment_matching_pm_rules"("p_organization_id" "uuid", "p_rules" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."count_equipment_matching_pm_rules"("p_organization_id" "uuid", "p_rules" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."count_equipment_matching_pm_rules"("p_organization_id" "uuid", "p_rules" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."count_equipment_matching_rules"("p_organization_id" "uuid", "p_rules" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."count_equipment_matching_rules"("p_organization_id" "uuid", "p_rules" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."count_equipment_matching_rules"("p_organization_id" "uuid", "p_rules" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_google_workspace_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_google_workspace_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_google_workspace_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb", "p_timeline_events" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb", "p_timeline_events" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_historical_work_order_with_pm"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "public"."work_order_priority", "p_status" "public"."work_order_status", "p_historical_start_date" timestamp with time zone, "p_historical_notes" "text", "p_assignee_id" "uuid", "p_team_id" "uuid", "p_due_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_has_pm" boolean, "p_pm_status" "text", "p_pm_completion_date" timestamp with time zone, "p_pm_notes" "text", "p_pm_checklist_data" "jsonb", "p_timeline_events" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_invitation_atomic"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation_atomic"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_invitation_atomic"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_invitation_bypass"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation_bypass"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_invitation_bypass_optimized"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation_bypass_optimized"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_invitation_with_context"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation_with_context"("p_organization_id" "uuid", "p_email" "text", "p_role" "text", "p_message" "text", "p_invited_by" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."external_customer_contacts" TO "anon";
GRANT ALL ON TABLE "public"."external_customer_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."external_customer_contacts" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_manual_external_customer_contact"("p_organization_id" "uuid", "p_customer_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_operator_checkin_assignment"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_template_id" "uuid", "p_enabled" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_operator_checkin_assignment"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_template_id" "uuid", "p_enabled" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."create_operator_checkin_assignment"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_template_id" "uuid", "p_enabled" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_quick_form"("p_organization_id" "uuid", "p_name" "text", "p_description" "text", "p_form_data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_quick_form"("p_organization_id" "uuid", "p_name" "text", "p_description" "text", "p_form_data" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_quick_form"("p_organization_id" "uuid", "p_name" "text", "p_description" "text", "p_form_data" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_quickbooks_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_quickbooks_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_quickbooks_oauth_session"("p_organization_id" "uuid", "p_redirect_url" "text", "p_origin_url" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_work_order_notifications"("work_order_uuid" "uuid", "new_status" "text", "changed_by_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_work_order_notifications"("work_order_uuid" "uuid", "new_status" "text", "changed_by_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_workspace_organization_for_domain"("p_domain" "text", "p_organization_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_workspace_organization_for_domain"("p_domain" "text", "p_organization_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_workspace_organization_for_domain"("p_domain" "text", "p_organization_name" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_equipment_note_image_audited"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_image_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_equipment_note_image_audited"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_image_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_equipment_note_image_audited"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_image_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_operator_checklist_template"("p_template_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_operator_checklist_template"("p_template_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_operator_checklist_template"("p_template_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_organization"("p_organization_id" "uuid", "p_confirmation_name" "text", "p_force" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_organization"("p_organization_id" "uuid", "p_confirmation_name" "text", "p_force" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_organization"("p_organization_id" "uuid", "p_confirmation_name" "text", "p_force" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_work_order_cascade"("p_work_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_work_order_cascade"("p_work_order_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_work_order_cascade"("p_work_order_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_work_order_note_image_audited"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_image_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_work_order_note_image_audited"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_image_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_work_order_note_image_audited"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_image_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."disconnect_google_workspace"("p_organization_id" "uuid", "p_also_unclaim_domain" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disconnect_google_workspace"("p_organization_id" "uuid", "p_also_unclaim_domain" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."disconnect_google_workspace"("p_organization_id" "uuid", "p_also_unclaim_domain" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."disconnect_google_workspace_internal"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disconnect_google_workspace_internal"("p_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."disconnect_quickbooks"("p_organization_id" "uuid", "p_realm_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disconnect_quickbooks"("p_organization_id" "uuid", "p_realm_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."disconnect_quickbooks"("p_organization_id" "uuid", "p_realm_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."enforce_manual_external_contact_metadata"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_manual_external_contact_metadata"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_scan_location_privacy"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_scan_location_privacy"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_work_order_primary_image_match"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_work_order_primary_image_match"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enqueue_export_job"("p_organization_id" "uuid", "p_report_type" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enqueue_export_job"("p_organization_id" "uuid", "p_report_type" "text", "p_payload" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."enqueue_export_job"("p_organization_id" "uuid", "p_report_type" "text", "p_payload" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."ensure_operator_template_active_for_enabled_assignment"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_operator_template_active_for_enabled_assignment"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."expire_old_invitations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_old_invitations"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."export_equipment_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_location" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."export_equipment_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_location" "text", "p_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."export_equipment_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_location" "text", "p_limit" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."export_work_orders_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_priority" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_accessible_team_ids" "uuid"[], "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."export_work_orders_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_priority" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_accessible_team_ids" "uuid"[], "p_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."export_work_orders_csv_rows"("p_organization_id" "uuid", "p_columns" "text"[], "p_status" "text", "p_team_id" "uuid", "p_priority" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_accessible_team_ids" "uuid"[], "p_limit" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."fulfill_dsr_deletion"("p_dsr_request_id" "uuid", "p_admin_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fulfill_dsr_deletion"("p_dsr_request_id" "uuid", "p_admin_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_alternates_for_inventory_item"("p_organization_id" "uuid", "p_inventory_item_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_alternates_for_inventory_item"("p_organization_id" "uuid", "p_inventory_item_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_alternates_for_inventory_item"("p_organization_id" "uuid", "p_inventory_item_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_alternates_for_part_number"("p_organization_id" "uuid", "p_part_number" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_alternates_for_part_number"("p_organization_id" "uuid", "p_part_number" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_alternates_for_part_number"("p_organization_id" "uuid", "p_part_number" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_audit_actor_info"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_audit_actor_info"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_audit_log_timeline"("p_organization_id" "uuid", "p_bucket" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_entity_type" "text", "p_action" "text", "p_actor_id" "uuid", "p_search" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_audit_log_timeline"("p_organization_id" "uuid", "p_bucket" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_entity_type" "text", "p_action" "text", "p_actor_id" "uuid", "p_search" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_audit_log_timeline"("p_organization_id" "uuid", "p_bucket" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone, "p_entity_type" "text", "p_action" "text", "p_actor_id" "uuid", "p_search" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_compatible_parts_for_equipment"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_compatible_parts_for_equipment"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_compatible_parts_for_equipment"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_compatible_parts_for_make_model"("p_organization_id" "uuid", "p_manufacturer" "text", "p_model" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_compatible_parts_for_make_model"("p_organization_id" "uuid", "p_manufacturer" "text", "p_model" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_compatible_parts_for_make_model"("p_organization_id" "uuid", "p_manufacturer" "text", "p_model" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_current_billing_period"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_current_billing_period"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_current_billing_period"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_current_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_trends"("p_org_id" "uuid", "p_days" integer, "p_team_id" "uuid", "p_unassigned" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_trends"("p_org_id" "uuid", "p_days" integer, "p_team_id" "uuid", "p_unassigned" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_dashboard_trends"("p_org_id" "uuid", "p_days" integer, "p_team_id" "uuid", "p_unassigned" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_effective_pm_interval_policy_for_equipment"("p_equipment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_effective_pm_interval_policy_for_equipment"("p_equipment_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_effective_pm_interval_policy_for_equipment"("p_equipment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_equipment_for_inventory_item_rules"("p_organization_id" "uuid", "p_item_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_equipment_for_inventory_item_rules"("p_organization_id" "uuid", "p_item_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_equipment_for_inventory_item_rules"("p_organization_id" "uuid", "p_item_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_equipment_pm_status"("p_equipment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_equipment_pm_status"("p_equipment_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_equipment_pm_status"("p_equipment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_export_job_status"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_export_job_status"("p_job_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_export_job_status"("p_job_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_fleet_efficiency"("p_org_id" "uuid", "p_team_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_fleet_efficiency"("p_org_id" "uuid", "p_team_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."get_fleet_efficiency"("p_org_id" "uuid", "p_team_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_global_pm_template_names"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_global_pm_template_names"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_global_pm_template_names"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_google_workspace_connection_status"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_google_workspace_connection_status"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_google_workspace_connection_status"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_inventory_list_metadata"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_inventory_list_metadata"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_inventory_list_metadata"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_invitation_by_token_secure"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_invitation_by_token_secure"("p_token" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_invitation_by_token_secure"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_by_token_secure"("p_token" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."get_invitations_atomic"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_invitations_atomic"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_invitations_atomic"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_invitations_bypass_optimized"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_invitations_bypass_optimized"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_latest_completed_pm"("equipment_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_latest_completed_pm"("equipment_uuid" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_latest_completed_pm"("equipment_uuid" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_matching_pm_templates"("p_organization_id" "uuid", "p_equipment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_matching_pm_templates"("p_organization_id" "uuid", "p_equipment_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_matching_pm_templates"("p_organization_id" "uuid", "p_equipment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_member_profiles_secure"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_member_profiles_secure"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_org_equipment_pm_statuses"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_org_equipment_pm_statuses"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_org_equipment_pm_statuses"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_organization_deletion_stats"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_deletion_stats"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_organization_deletion_stats"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_organization_exemptions"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_exemptions"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_member_profile"("member_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_member_profile"("member_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_premium_features"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_premium_features"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_slot_availability"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_slot_availability"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_slot_availability_with_exemptions"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_slot_availability_with_exemptions"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_storage_mb"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_storage_mb"("org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_organization_storage_mb"("org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_pending_transfer_requests"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_transfer_requests"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_pending_transfer_requests"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_pending_workspace_personal_org_merge_requests"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_workspace_personal_org_merge_requests"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_pending_workspace_personal_org_merge_requests"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_personal_org_merge_preview"("p_workspace_org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_personal_org_merge_preview"("p_workspace_org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_personal_org_merge_preview"("p_workspace_org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_product_onboarding_status"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_product_onboarding_status"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_product_onboarding_status"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_quickbooks_connection_status"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_quickbooks_connection_status"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_quickbooks_connection_status"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_system_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_system_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_invitations_safe"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_invitations_safe"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_invitations_safe"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_user_managed_teams"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_managed_teams"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_org_role_direct"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_org_role_direct"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_org_role_direct"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_user_org_role_secure"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_org_role_secure"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_organization_membership"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_organization_membership"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_organizations"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_organizations"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_quickbooks_permission"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_quickbooks_permission"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_quickbooks_permission"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_user_team_memberships"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_team_memberships"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_team_memberships"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_user_teams_for_notifications"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_teams_for_notifications"("user_uuid" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_teams_for_notifications"("user_uuid" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_workspace_onboarding_state"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_workspace_onboarding_state"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_workspace_onboarding_state"("p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."handle_invitation_account_creation"("p_invitation_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_invitation_account_creation"("p_invitation_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_membership_billing_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_membership_billing_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_team_deletion"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_team_deletion"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_team_manager_removal"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_team_manager_removal"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."historical_timeline_allowed_next_statuses"("p_current_status" "public"."work_order_status") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."historical_timeline_allowed_next_statuses"("p_current_status" "public"."work_order_status") TO "service_role";
GRANT ALL ON FUNCTION "public"."historical_timeline_allowed_next_statuses"("p_current_status" "public"."work_order_status") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."initiate_ownership_transfer"("p_organization_id" "uuid", "p_to_user_id" "uuid", "p_transfer_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."initiate_ownership_transfer"("p_organization_id" "uuid", "p_to_user_id" "uuid", "p_transfer_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."initiate_ownership_transfer"("p_organization_id" "uuid", "p_to_user_id" "uuid", "p_transfer_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."invoke_queue_worker"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."invoke_quickbooks_invoice_status_sync"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."invoke_quickbooks_token_refresh"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."is_equipment_team_manager"("p_user_id" "uuid", "p_equipment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_equipment_team_manager"("p_user_id" "uuid", "p_equipment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_org_admin"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_org_admin"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_org_admin"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_org_member"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_org_member"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_org_member"("user_uuid" "uuid", "org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_organization_admin"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_organization_admin"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_organization_member"("user_uuid" "uuid", "org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_organization_member"("user_uuid" "uuid", "org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_parts_consumer"("p_organization_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_parts_consumer"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_parts_consumer"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_parts_manager"("p_organization_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_parts_manager"("p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_parts_manager"("p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_team_viewer_or_requestor"("p_user_id" "uuid", "p_team_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_team_viewer_or_requestor"("p_user_id" "uuid", "p_team_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_user_google_oauth_verified"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_user_google_oauth_verified"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_valid_work_order_assignee"("p_equipment_id" "uuid", "p_organization_id" "uuid", "p_assignee_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_valid_work_order_assignee"("p_equipment_id" "uuid", "p_organization_id" "uuid", "p_assignee_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_work_order_team_manager"("p_user_id" "uuid", "p_work_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_work_order_team_manager"("p_user_id" "uuid", "p_work_order_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."latest_scans_for_equipment_ids"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."latest_scans_for_equipment_ids"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."latest_scans_for_equipment_ids"("p_organization_id" "uuid", "p_equipment_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."leave_organization"("p_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_organization"("p_organization_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."leave_organization"("p_organization_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."leave_organization_safely"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_organization_safely"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_active_stripe_subscriptions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_active_stripe_subscriptions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_operator_checkin_restorable_template_ids"("p_organization_id" "uuid", "p_template_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_operator_checkin_restorable_template_ids"("p_organization_id" "uuid", "p_template_ids" "uuid"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."list_operator_checkin_restorable_template_ids"("p_organization_id" "uuid", "p_template_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_pm_templates"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_pm_templates"() TO "service_role";
GRANT ALL ON FUNCTION "public"."list_pm_templates"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_pm_templates"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_pm_templates"("org_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."list_pm_templates"("org_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."log_audit_entry"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_entity_name" "text", "p_action" "text", "p_changes" "jsonb", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_audit_entry"("p_organization_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_entity_name" "text", "p_action" "text", "p_changes" "jsonb", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_audit_export_notification"("p_organization_id" "uuid", "p_exported_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_audit_export_notification"("p_organization_id" "uuid", "p_exported_count" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."log_audit_export_notification"("p_organization_id" "uuid", "p_exported_count" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."log_dsr_intake_event"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_dsr_intake_event"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_dsr_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_dsr_status_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_equipment_location_change"("p_equipment_id" "uuid", "p_source" "text", "p_latitude" double precision, "p_longitude" double precision, "p_address_street" "text", "p_address_city" "text", "p_address_state" "text", "p_address_country" "text", "p_formatted_address" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_equipment_location_change"("p_equipment_id" "uuid", "p_source" "text", "p_latitude" double precision, "p_longitude" double precision, "p_address_street" "text", "p_address_city" "text", "p_address_state" "text", "p_address_country" "text", "p_formatted_address" "text", "p_metadata" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."log_equipment_location_change"("p_equipment_id" "uuid", "p_source" "text", "p_latitude" double precision, "p_longitude" double precision, "p_address_street" "text", "p_address_city" "text", "p_address_state" "text", "p_address_country" "text", "p_formatted_address" "text", "p_metadata" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."log_invitation_performance"("function_name" "text", "execution_time_ms" numeric, "success" boolean, "error_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_invitation_performance"("function_name" "text", "execution_time_ms" numeric, "success" boolean, "error_message" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."log_invitation_performance"("function_name" "text", "execution_time_ms" numeric, "success" boolean, "error_message" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."log_invoice_export_audit"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_action" "text", "p_quickbooks_invoice_id" "text", "p_quickbooks_invoice_number" "text", "p_realm_id" "text", "p_ip_address" "text", "p_actor_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_invoice_export_audit"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_action" "text", "p_quickbooks_invoice_id" "text", "p_quickbooks_invoice_number" "text", "p_realm_id" "text", "p_ip_address" "text", "p_actor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_pm_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_pm_status_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_scan_location_history"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_scan_location_history"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_work_order_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_work_order_status_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."migrate_personal_org_to_workspace_for_user"("p_workspace_org_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."migrate_personal_org_to_workspace_for_user"("p_workspace_org_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."migrate_personal_orgs_to_workspace"("p_workspace_org_id" "uuid", "p_domain" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."migrate_personal_orgs_to_workspace"("p_workspace_org_id" "uuid", "p_domain" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."monitoring_healthcheck"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."monitoring_healthcheck"() TO "service_role";
GRANT ALL ON FUNCTION "public"."monitoring_healthcheck"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."normalize_compatibility_pattern"("p_match_type" "public"."model_match_type", "p_pattern" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_compatibility_pattern"("p_match_type" "public"."model_match_type", "p_pattern" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."normalize_domain"("p_domain" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_domain"("p_domain" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."normalize_email"("p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_email"("p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_org_admins"("p_organization_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_data" "jsonb", "p_actor_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_org_admins"("p_organization_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_data" "jsonb", "p_actor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_organization_member_security_events"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_organization_member_security_events"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_team_member_security_events"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_team_member_security_events"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."peek_google_workspace_oauth_session"("p_session_token" "text", "p_nonce" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."peek_google_workspace_oauth_session"("p_session_token" "text", "p_nonce" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_account_deletion"("p_user_id" "uuid", "p_dsr_request_id" "uuid", "p_actor_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_account_deletion"("p_user_id" "uuid", "p_dsr_request_id" "uuid", "p_actor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."preserve_user_attribution"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."preserve_user_attribution"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."prevent_dsr_event_mutation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_dsr_event_mutation"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prevent_inactive_operator_template_with_enabled_assignments"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_inactive_operator_template_with_enabled_assignments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_used_equipment_group_delete"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."preview_account_deletion"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."preview_account_deletion"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_all_pending_departures"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_all_pending_departures"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_departure_batch"("p_queue_id" "uuid", "p_batch_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_departure_batch"("p_queue_id" "uuid", "p_batch_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_equipment_group_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reconcile_google_workspace_directory"("p_organization_id" "uuid", "p_sync_started_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reconcile_google_workspace_directory"("p_organization_id" "uuid", "p_sync_started_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_equipment_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_equipment_status_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_quickbooks_tokens_manual"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_quickbooks_tokens_manual"() TO "service_role";
GRANT ALL ON FUNCTION "public"."refresh_quickbooks_tokens_manual"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."refresh_stripe_materialized_views"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."release_reserved_slot"("org_id" "uuid", "invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_reserved_slot"("org_id" "uuid", "invitation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_organization_member"("p_organization_id" "uuid", "p_user_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_organization_member"("p_organization_id" "uuid", "p_user_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_organization_member_safely"("user_uuid" "uuid", "org_id" "uuid", "removed_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_organization_member_safely"("user_uuid" "uuid", "org_id" "uuid", "removed_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."replace_historical_work_order_timeline"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."replace_historical_work_order_timeline"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."replace_historical_work_order_timeline"("p_work_order_id" "uuid", "p_organization_id" "uuid", "p_events" "jsonb", "p_skip_audit" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."request_workspace_personal_org_merge"("p_workspace_org_id" "uuid", "p_target_user_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_workspace_personal_org_merge"("p_workspace_org_id" "uuid", "p_target_user_id" "uuid", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."request_workspace_personal_org_merge"("p_workspace_org_id" "uuid", "p_target_user_id" "uuid", "p_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."reserve_slot_for_invitation"("org_id" "uuid", "invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_slot_for_invitation"("org_id" "uuid", "invitation_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."reserve_slot_for_invitation"("org_id" "uuid", "invitation_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."resolve_effective_pm_interval_policy"("p_equipment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolve_effective_pm_interval_policy"("p_equipment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."resolve_operator_checkin_by_token"("p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolve_operator_checkin_by_token"("p_token_hash" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."resolve_operator_checkin_by_token"("p_token_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_operator_checkin_by_token"("p_token_hash" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."resolve_quick_form_by_token"("p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolve_quick_form_by_token"("p_token_hash" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."resolve_quick_form_by_token"("p_token_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_quick_form_by_token"("p_token_hash" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."respond_to_ownership_transfer"("p_transfer_id" "uuid", "p_accept" boolean, "p_departing_owner_role" "text", "p_response_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_ownership_transfer"("p_transfer_id" "uuid", "p_accept" boolean, "p_departing_owner_role" "text", "p_response_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."respond_to_ownership_transfer"("p_transfer_id" "uuid", "p_accept" boolean, "p_departing_owner_role" "text", "p_response_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."respond_to_workspace_personal_org_merge"("p_request_id" "uuid", "p_accept" boolean, "p_response_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_workspace_personal_org_merge"("p_request_id" "uuid", "p_accept" boolean, "p_response_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."respond_to_workspace_personal_org_merge"("p_request_id" "uuid", "p_accept" boolean, "p_response_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_operator_checklist_template"("p_template_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_operator_checklist_template"("p_template_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_operator_checklist_template"("p_template_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."revert_pm_completion"("p_pm_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revert_pm_completion"("p_pm_id" "uuid", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."revert_pm_completion"("p_pm_id" "uuid", "p_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."revert_work_order_status"("p_work_order_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revert_work_order_status"("p_work_order_id" "uuid", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."revert_work_order_status"("p_work_order_id" "uuid", "p_reason" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."rotate_operator_checkin_token"("p_settings_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rotate_operator_checkin_token"("p_settings_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."rotate_operator_checkin_token"("p_settings_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."rotate_quick_form_token"("p_quick_form_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rotate_quick_form_token"("p_quick_form_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."rotate_quick_form_token"("p_quick_form_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."select_google_workspace_members"("p_organization_id" "uuid", "p_emails" "text"[], "p_admin_emails" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."select_google_workspace_members"("p_organization_id" "uuid", "p_emails" "text"[], "p_admin_emails" "text"[]) TO "service_role";
GRANT ALL ON FUNCTION "public"."select_google_workspace_members"("p_organization_id" "uuid", "p_emails" "text"[], "p_admin_emails" "text"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_bypass_triggers"("bypass" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_bypass_triggers"("bypass" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_equipment_note_organization_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_equipment_note_organization_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_geocoded_locations_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_geocoded_locations_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_rls_context"("context_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_rls_context"("context_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."should_notify_user_for_work_order"("user_uuid" "uuid", "work_order_team_id" "uuid", "work_order_status" "text", "organization_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."should_notify_user_for_work_order"("user_uuid" "uuid", "work_order_team_id" "uuid", "work_order_status" "text", "organization_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."snapshot_account_deletion_attribution"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."snapshot_account_deletion_attribution"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."snapshot_pm_working_hours"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."snapshot_pm_working_hours"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."storage_object_path_segment_uuid"("p_object_name" "text", "p_segment_index" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."storage_object_path_segment_uuid"("p_object_name" "text", "p_segment_index" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_operator_checkin_public"("p_token_hash" "text", "p_operator_field_values" "jsonb", "p_client_field_values" "jsonb", "p_equipment_field_values" "jsonb", "p_checklist_answers" "jsonb", "p_template_snapshot" "jsonb", "p_is_complete" boolean, "p_required_item_count" integer, "p_answered_required_count" integer, "p_request_fingerprint" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_operator_checkin_public"("p_token_hash" "text", "p_operator_field_values" "jsonb", "p_client_field_values" "jsonb", "p_equipment_field_values" "jsonb", "p_checklist_answers" "jsonb", "p_template_snapshot" "jsonb", "p_is_complete" boolean, "p_required_item_count" integer, "p_answered_required_count" integer, "p_request_fingerprint" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_quick_form_public"("p_token_hash" "text", "p_field_values" "jsonb", "p_client_context" "jsonb", "p_form_snapshot" "jsonb", "p_request_fingerprint" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_quick_form_public"("p_token_hash" "text", "p_field_values" "jsonb", "p_client_context" "jsonb", "p_form_snapshot" "jsonb", "p_request_fingerprint" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_equipment_customer_from_team"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_equipment_customer_from_team"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_equipment_last_known_location_from_scan"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_equipment_last_known_location_from_scan"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_equipment_last_maintenance_from_work_order"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_equipment_last_maintenance_from_work_order"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_work_order_primary_equipment"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_work_order_primary_equipment"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."synthesize_historical_timeline_events"("p_historical_start_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_status" "public"."work_order_status", "p_assignee_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."synthesize_historical_timeline_events"("p_historical_start_date" timestamp with time zone, "p_completed_date" timestamp with time zone, "p_status" "public"."work_order_status", "p_assignee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_equipment_group_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."touch_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_departure_processing"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_departure_processing"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_customers_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_customers_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_equipment_note"("p_organization_id" "uuid", "p_equipment_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_equipment_working_hours"("p_equipment_id" "uuid", "p_new_hours" numeric, "p_update_source" "text", "p_work_order_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_equipment_working_hours"("p_equipment_id" "uuid", "p_new_hours" numeric, "p_update_source" "text", "p_work_order_id" "uuid", "p_notes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_equipment_working_hours"("p_equipment_id" "uuid", "p_new_hours" numeric, "p_update_source" "text", "p_work_order_id" "uuid", "p_notes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_external_customer_contacts_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_external_customer_contacts_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_historical_work_order_note_timestamp"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_created_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_historical_work_order_note_timestamp"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_created_at" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_historical_work_order_note_timestamp"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_created_at" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_manual_external_customer_contact"("p_organization_id" "uuid", "p_contact_id" "uuid", "p_name" "text", "p_email" "text", "p_phone" "text", "p_role" "text", "p_notes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_member_quickbooks_permission"("p_organization_id" "uuid", "p_target_user_id" "uuid", "p_can_manage_quickbooks" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_member_quickbooks_permission"("p_organization_id" "uuid", "p_target_user_id" "uuid", "p_can_manage_quickbooks" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_member_quickbooks_permission"("p_organization_id" "uuid", "p_target_user_id" "uuid", "p_can_manage_quickbooks" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_notification_settings_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_notification_settings_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_organization_billing_metrics"("org_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_organization_billing_metrics"("org_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_organization_member_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_organization_member_count"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_organization_storage"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_organization_storage"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_pm_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_pm_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_quickbooks_credentials_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_quickbooks_credentials_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_quickbooks_export_logs_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_quickbooks_export_logs_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_quickbooks_invoice_status_events_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_quickbooks_invoice_status_events_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_quickbooks_team_customers_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_quickbooks_team_customers_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_work_order_costs_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_work_order_costs_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."update_work_order_note"("p_organization_id" "uuid", "p_work_order_id" "uuid", "p_note_id" "uuid", "p_content" "text", "p_is_private" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."user_has_access"("user_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_has_access"("user_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."user_is_org_admin"("org_id" "uuid", "check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_is_org_admin"("org_id" "uuid", "check_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."user_is_org_admin"("org_id" "uuid", "check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."user_is_org_member"("org_id" "uuid", "check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_is_org_member"("org_id" "uuid", "check_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."user_is_org_member"("org_id" "uuid", "check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."validate_google_workspace_oauth_session"("p_session_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_google_workspace_oauth_session"("p_session_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_invitation_for_account_creation"("p_invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_invitation_for_account_creation"("p_invitation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_member_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_member_limit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_operator_checkin_settings_org_refs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_operator_checkin_settings_org_refs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_operator_checkin_submission_org_refs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_operator_checkin_submission_org_refs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_quickbooks_oauth_session"("p_session_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_quickbooks_oauth_session"("p_session_token" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."validate_quickbooks_oauth_session"("p_session_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."validate_work_order_assignee"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_work_order_assignee"() TO "service_role";






























GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."customer_contacts" TO "anon";
GRANT ALL ON TABLE "public"."customer_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."customer_sites" TO "anon";
GRANT ALL ON TABLE "public"."customer_sites" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_sites" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."dsr_request_events" TO "anon";
GRANT ALL ON TABLE "public"."dsr_request_events" TO "authenticated";
GRANT ALL ON TABLE "public"."dsr_request_events" TO "service_role";



GRANT ALL ON TABLE "public"."dsr_requests" TO "anon";
GRANT ALL ON TABLE "public"."dsr_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."dsr_requests" TO "service_role";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_groups" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_location_history" TO "anon";
GRANT ALL ON TABLE "public"."equipment_location_history" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_location_history" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_note_images" TO "anon";
GRANT ALL ON TABLE "public"."equipment_note_images" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_note_images" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_notes" TO "anon";
GRANT ALL ON TABLE "public"."equipment_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_notes" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_operator_checkin_settings" TO "anon";
GRANT ALL ON TABLE "public"."equipment_operator_checkin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_operator_checkin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_part_compatibility" TO "anon";
GRANT ALL ON TABLE "public"."equipment_part_compatibility" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_part_compatibility" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_status_history" TO "anon";
GRANT ALL ON TABLE "public"."equipment_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_working_hours_history" TO "anon";
GRANT ALL ON TABLE "public"."equipment_working_hours_history" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_working_hours_history" TO "service_role";



GRANT ALL ON TABLE "public"."export_request_log" TO "anon";
GRANT ALL ON TABLE "public"."export_request_log" TO "authenticated";
GRANT ALL ON TABLE "public"."export_request_log" TO "service_role";



GRANT ALL ON TABLE "public"."geocoded_locations" TO "anon";
GRANT ALL ON TABLE "public"."geocoded_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."geocoded_locations" TO "service_role";



GRANT ALL ON TABLE "public"."google_workspace_credentials" TO "anon";
GRANT ALL ON TABLE "public"."google_workspace_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."google_workspace_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."google_workspace_directory_users" TO "anon";
GRANT ALL ON TABLE "public"."google_workspace_directory_users" TO "authenticated";
GRANT ALL ON TABLE "public"."google_workspace_directory_users" TO "service_role";



GRANT ALL ON TABLE "public"."google_workspace_oauth_sessions" TO "anon";
GRANT ALL ON TABLE "public"."google_workspace_oauth_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."google_workspace_oauth_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_item_images" TO "anon";
GRANT ALL ON TABLE "public"."inventory_item_images" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_item_images" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_performance_logs" TO "anon";
GRANT ALL ON TABLE "public"."invitation_performance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_performance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."member_removal_audit" TO "anon";
GRANT ALL ON TABLE "public"."member_removal_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."member_removal_audit" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."operator_checkin_submissions" TO "anon";
GRANT ALL ON TABLE "public"."operator_checkin_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."operator_checkin_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."operator_checkin_token_secrets" TO "anon";
GRANT ALL ON TABLE "public"."operator_checkin_token_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."operator_checkin_token_secrets" TO "service_role";



GRANT ALL ON TABLE "public"."operator_checklist_templates" TO "anon";
GRANT ALL ON TABLE "public"."operator_checklist_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."operator_checklist_templates" TO "service_role";



GRANT ALL ON TABLE "public"."organization_google_export_destinations" TO "anon";
GRANT ALL ON TABLE "public"."organization_google_export_destinations" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_google_export_destinations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_invitations" TO "anon";
GRANT ALL ON TABLE "public"."organization_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_member_claims" TO "anon";
GRANT ALL ON TABLE "public"."organization_member_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_member_claims" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organization_role_grants_pending" TO "anon";
GRANT ALL ON TABLE "public"."organization_role_grants_pending" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_role_grants_pending" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."ownership_transfer_requests" TO "anon";
GRANT ALL ON TABLE "public"."ownership_transfer_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."ownership_transfer_requests" TO "service_role";



GRANT ALL ON TABLE "public"."part_alternate_group_members" TO "anon";
GRANT ALL ON TABLE "public"."part_alternate_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."part_alternate_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."part_alternate_groups" TO "anon";
GRANT ALL ON TABLE "public"."part_alternate_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."part_alternate_groups" TO "service_role";



GRANT ALL ON TABLE "public"."part_compatibility_rules" TO "anon";
GRANT ALL ON TABLE "public"."part_compatibility_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."part_compatibility_rules" TO "service_role";



GRANT ALL ON TABLE "public"."part_identifiers" TO "anon";
GRANT ALL ON TABLE "public"."part_identifiers" TO "authenticated";
GRANT ALL ON TABLE "public"."part_identifiers" TO "service_role";



GRANT ALL ON TABLE "public"."parts_consumers" TO "anon";
GRANT ALL ON TABLE "public"."parts_consumers" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_consumers" TO "service_role";



GRANT ALL ON TABLE "public"."parts_managers" TO "anon";
GRANT ALL ON TABLE "public"."parts_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_managers" TO "service_role";



GRANT ALL ON TABLE "public"."personal_organizations" TO "anon";
GRANT ALL ON TABLE "public"."personal_organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_organizations" TO "service_role";



GRANT ALL ON TABLE "public"."pm_checklist_templates" TO "anon";
GRANT ALL ON TABLE "public"."pm_checklist_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_checklist_templates" TO "service_role";



GRANT ALL ON TABLE "public"."pm_interval_policies" TO "anon";
GRANT ALL ON TABLE "public"."pm_interval_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_interval_policies" TO "service_role";



GRANT ALL ON TABLE "public"."pm_status_history" TO "anon";
GRANT ALL ON TABLE "public"."pm_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."pm_template_compatibility_rules" TO "anon";
GRANT ALL ON TABLE "public"."pm_template_compatibility_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_template_compatibility_rules" TO "service_role";



GRANT ALL ON TABLE "public"."pm_templates_check" TO "anon";
GRANT ALL ON TABLE "public"."pm_templates_check" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_templates_check" TO "service_role";



GRANT ALL ON TABLE "public"."preventative_maintenance" TO "anon";
GRANT ALL ON TABLE "public"."preventative_maintenance" TO "authenticated";
GRANT ALL ON TABLE "public"."preventative_maintenance" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."quick_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."quick_form_token_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_form_token_secrets" TO "service_role";



GRANT ALL ON TABLE "public"."quick_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_forms" TO "service_role";



GRANT ALL ON TABLE "public"."quickbooks_credentials" TO "service_role";
GRANT ALL ON TABLE "public"."quickbooks_credentials" TO "anon";
GRANT ALL ON TABLE "public"."quickbooks_credentials" TO "authenticated";



GRANT ALL ON TABLE "public"."quickbooks_export_logs" TO "anon";
GRANT ALL ON TABLE "public"."quickbooks_export_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."quickbooks_export_logs" TO "service_role";



GRANT ALL ON TABLE "public"."quickbooks_invoice_status_events" TO "anon";
GRANT ALL ON TABLE "public"."quickbooks_invoice_status_events" TO "authenticated";
GRANT ALL ON TABLE "public"."quickbooks_invoice_status_events" TO "service_role";



GRANT ALL ON TABLE "public"."quickbooks_oauth_sessions" TO "anon";
GRANT ALL ON TABLE "public"."quickbooks_oauth_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."quickbooks_oauth_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."quickbooks_team_customers" TO "anon";
GRANT ALL ON TABLE "public"."quickbooks_team_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."quickbooks_team_customers" TO "service_role";



GRANT ALL ON TABLE "public"."record_export_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."record_export_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."record_export_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."scan_follow_up_events" TO "anon";
GRANT ALL ON TABLE "public"."scan_follow_up_events" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_follow_up_events" TO "service_role";



GRANT ALL ON TABLE "public"."scans" TO "anon";
GRANT ALL ON TABLE "public"."scans" TO "authenticated";
GRANT ALL ON TABLE "public"."scans" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."terms_acceptances" TO "anon";
GRANT ALL ON TABLE "public"."terms_acceptances" TO "authenticated";
GRANT ALL ON TABLE "public"."terms_acceptances" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_comments" TO "anon";
GRANT ALL ON TABLE "public"."ticket_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_comments" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_departure_queue" TO "anon";
GRANT ALL ON TABLE "public"."user_departure_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."user_departure_queue" TO "service_role";



GRANT ALL ON TABLE "public"."user_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."user_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."work_order_costs" TO "anon";
GRANT ALL ON TABLE "public"."work_order_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_costs" TO "service_role";



GRANT ALL ON TABLE "public"."work_order_equipment" TO "anon";
GRANT ALL ON TABLE "public"."work_order_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."work_order_images" TO "anon";
GRANT ALL ON TABLE "public"."work_order_images" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_images" TO "service_role";



GRANT ALL ON TABLE "public"."work_order_notes" TO "anon";
GRANT ALL ON TABLE "public"."work_order_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_notes" TO "service_role";



GRANT ALL ON TABLE "public"."work_order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."work_order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."work_orders" TO "anon";
GRANT ALL ON TABLE "public"."work_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."work_orders" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_domains" TO "anon";
GRANT ALL ON TABLE "public"."workspace_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_domains" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_personal_org_merge_requests" TO "anon";
GRANT ALL ON TABLE "public"."workspace_personal_org_merge_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_personal_org_merge_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "pgmq_public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";





























