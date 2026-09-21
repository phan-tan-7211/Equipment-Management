-- rpc-authenticated-grant-allowed: grant_platform_admin
-- rpc-authenticated-grant-allowed: revoke_platform_admin
-- Checkpoint C1: backend-owned Platform Admin authority.
--
-- The registry intentionally starts empty. Initial bootstrap must be performed
-- by a database administrator for an existing verified auth user.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
REVOKE ALL ON SCHEMA private FROM service_role;

CREATE TABLE private.platform_admins (
  user_id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  granted_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by uuid
    REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT platform_admins_revocation_audit_check
    CHECK (revoked_at IS NOT NULL OR revoked_by IS NULL)
);

ALTER TABLE private.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.platform_admins FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.platform_admins FROM PUBLIC;
REVOKE ALL ON TABLE private.platform_admins FROM anon;
REVOKE ALL ON TABLE private.platform_admins FROM authenticated;
REVOKE ALL ON TABLE private.platform_admins FROM service_role;

COMMENT ON TABLE private.platform_admins IS
  'Backend-owned Platform Admin authority registry; an active administrator has revoked_at IS NULL.';
COMMENT ON COLUMN private.platform_admins.granted_by IS
  'Granting Platform Admin user; NULL only for controlled database-administrator bootstrap.';

CREATE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
SET row_security TO 'off'
AS $$
  SELECT p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM private.platform_admins AS platform_admin
      WHERE platform_admin.user_id = p_user_id
        AND platform_admin.revoked_at IS NULL
    );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO service_role;

COMMENT ON FUNCTION public.is_platform_admin(uuid) IS
  'Service-only Platform Admin predicate backed exclusively by private.platform_admins.';

CREATE FUNCTION public.grant_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
SET row_security TO 'off'
AS $$
DECLARE
  actor_id uuid := auth.uid();
BEGIN
  LOCK TABLE private.platform_admins IN SHARE ROW EXCLUSIVE MODE;

  IF actor_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = actor_id
      AND platform_admin.revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Platform Admin authority required';
  END IF;

  IF p_user_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM auth.users AS target_user
    WHERE target_user.id = p_user_id
      AND (
        target_user.email_confirmed_at IS NOT NULL
        OR target_user.phone_confirmed_at IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Target must be an existing verified auth user';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = p_user_id
      AND platform_admin.revoked_at IS NULL
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO private.platform_admins (
    user_id,
    granted_at,
    granted_by,
    revoked_at,
    revoked_by
  ) VALUES (
    p_user_id,
    pg_catalog.clock_timestamp(),
    actor_id,
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET granted_at = EXCLUDED.granted_at,
      granted_by = EXCLUDED.granted_by,
      revoked_at = NULL,
      revoked_by = NULL;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_platform_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_platform_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.grant_platform_admin(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.grant_platform_admin(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.grant_platform_admin(uuid) TO authenticated;

COMMENT ON FUNCTION public.grant_platform_admin(uuid) IS
  'Grants Platform Admin authority to a verified auth user; callable only by an active Platform Admin.';

CREATE FUNCTION public.revoke_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
SET row_security TO 'off'
AS $$
DECLARE
  actor_id uuid := auth.uid();
  active_admin_count integer;
BEGIN
  LOCK TABLE private.platform_admins IN SHARE ROW EXCLUSIVE MODE;

  IF actor_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = actor_id
      AND platform_admin.revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Platform Admin authority required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = p_user_id
      AND platform_admin.revoked_at IS NULL
  ) THEN
    RETURN false;
  END IF;

  SELECT count(*)::integer
  INTO active_admin_count
  FROM private.platform_admins AS platform_admin
  WHERE platform_admin.revoked_at IS NULL;

  IF active_admin_count <= 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Cannot revoke the final active Platform Admin';
  END IF;

  UPDATE private.platform_admins
  SET revoked_at = pg_catalog.clock_timestamp(),
      revoked_by = actor_id
  WHERE user_id = p_user_id
    AND revoked_at IS NULL;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_platform_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_platform_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_platform_admin(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.revoke_platform_admin(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.revoke_platform_admin(uuid) TO authenticated;

COMMENT ON FUNCTION public.revoke_platform_admin(uuid) IS
  'Revokes Platform Admin authority while preserving at least one active Platform Admin.';

COMMIT;
