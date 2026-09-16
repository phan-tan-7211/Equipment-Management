-- Promote the two management-responsible values to first-class equipment fields.
-- The JSON cleanup removes only the matching keys and preserves every other
-- custom attribute on the equipment row.

BEGIN;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS management_responsible_primary text,
  ADD COLUMN IF NOT EXISTS management_responsible_secondary text;

COMMENT ON COLUMN public.equipment.management_responsible_primary IS
  'Primary person responsible for managing the equipment.';
COMMENT ON COLUMN public.equipment.management_responsible_secondary IS
  'Secondary person responsible for managing the equipment.';

UPDATE public.equipment AS e
SET
  management_responsible_primary = COALESCE(
    NULLIF(BTRIM(e.management_responsible_primary), ''),
    NULLIF(BTRIM((
      SELECT a.value #>> '{}'
      FROM jsonb_each(
        CASE
          WHEN jsonb_typeof(e.custom_attributes) = 'object' THEN e.custom_attributes
          ELSE '{}'::jsonb
        END
      ) AS a(key, value)
      WHERE LOWER(BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(a.key, '([a-z0-9])([A-Z])', E'\\1 \\2', 'g'),
        '[_-]+', ' ', 'g'
      ))) = 'management responsible primary'
      LIMIT 1
    )), '')
  ),
  management_responsible_secondary = COALESCE(
    NULLIF(BTRIM(e.management_responsible_secondary), ''),
    NULLIF(BTRIM((
      SELECT a.value #>> '{}'
      FROM jsonb_each(
        CASE
          WHEN jsonb_typeof(e.custom_attributes) = 'object' THEN e.custom_attributes
          ELSE '{}'::jsonb
        END
      ) AS a(key, value)
      WHERE LOWER(BTRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(a.key, '([a-z0-9])([A-Z])', E'\\1 \\2', 'g'),
        '[_-]+', ' ', 'g'
      ))) = 'management responsible secondary'
      LIMIT 1
    )), '')
  ),
  custom_attributes = COALESCE((
    SELECT JSONB_OBJECT_AGG(a.key, a.value)
    FROM jsonb_each(
      CASE
        WHEN jsonb_typeof(e.custom_attributes) = 'object' THEN e.custom_attributes
        ELSE '{}'::jsonb
      END
    ) AS a(key, value)
    WHERE LOWER(BTRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(a.key, '([a-z0-9])([A-Z])', E'\\1 \\2', 'g'),
      '[_-]+', ' ', 'g'
    ))) NOT IN (
      'management responsible primary',
      'management responsible secondary'
    )
  ), '{}'::jsonb)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_each(
    CASE
      WHEN jsonb_typeof(e.custom_attributes) = 'object' THEN e.custom_attributes
      ELSE '{}'::jsonb
    END
  ) AS a(key, value)
  WHERE LOWER(BTRIM(REGEXP_REPLACE(
    REGEXP_REPLACE(a.key, '([a-z0-9])([A-Z])', E'\\1 \\2', 'g'),
    '[_-]+', ' ', 'g'
  ))) IN (
    'management responsible primary',
    'management responsible secondary'
  )
);

-- Keep the standard fields in the existing equipment audit trail.
CREATE OR REPLACE FUNCTION public.audit_equipment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMIT;
