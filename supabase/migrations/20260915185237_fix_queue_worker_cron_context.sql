-- Fix the hosted Supabase pg_cron context check used by the export queue.
-- pg_cron runs this job as postgres, but hosted cron does not reliably expose
-- cron.job_id through current_setting(). The function remains inaccessible to
-- application roles; only the postgres role retains EXECUTE permission.

BEGIN;

CREATE OR REPLACE FUNCTION public.invoke_queue_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  service_role_key text;
  supabase_url text;
  request_id bigint;
BEGIN
  -- cron.job.username is postgres for the scheduled queue drainer. Do not
  -- require cron.job_id because hosted pg_cron may leave that setting unset.
  IF session_user::text <> 'postgres' THEN
    RAISE EXCEPTION 'Access denied: invoke_queue_worker can only be called as postgres';
  END IF;

  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url'
  LIMIT 1;

  IF service_role_key IS NULL OR supabase_url IS NULL THEN
    RAISE WARNING 'Queue worker invocation skipped: vault secrets not configured';
    RETURN;
  END IF;

  IF supabase_url !~ '^https://[A-Za-z0-9.-]+\\.supabase\\.co/?$' THEN
    RAISE WARNING 'Queue worker invocation skipped: invalid supabase_url format in vault secrets';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/queue-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  IF request_id IS NULL THEN
    RAISE WARNING 'Failed to schedule queue worker invocation';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invoke_queue_worker() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
