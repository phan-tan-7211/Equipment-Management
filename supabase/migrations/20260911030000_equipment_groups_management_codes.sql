-- Equipment classification master data and stable management codes.
-- Designed so group names can change without changing issued equipment codes.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS equipment_code_prefix text NOT NULL DEFAULT 'EQ';

UPDATE public.organizations
SET equipment_code_prefix = 'CEV'
WHERE name = 'CEV' AND equipment_code_prefix = 'EQ';

CREATE TABLE IF NOT EXISTS public.equipment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  examples text,
  management_focus text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  next_sequence bigint NOT NULL DEFAULT 1 CHECK (next_sequence >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT equipment_groups_code_format CHECK (code ~ '^[A-Z0-9]{2,10}$'),
  CONSTRAINT equipment_groups_org_code_key UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_equipment_groups_organization
  ON public.equipment_groups (organization_id, is_active, name);

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS equipment_group_id uuid REFERENCES public.equipment_groups(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS management_code text;

ALTER TABLE public.equipment
  ALTER COLUMN serial_number DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS equipment_org_management_code_key
  ON public.equipment (organization_id, management_code)
  WHERE management_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_equipment_group_id
  ON public.equipment (equipment_group_id);

ALTER TABLE public.equipment_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS equipment_groups_members_select ON public.equipment_groups;
CREATE POLICY equipment_groups_members_select
  ON public.equipment_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = equipment_groups.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS equipment_groups_admin_insert ON public.equipment_groups;
CREATE POLICY equipment_groups_admin_insert
  ON public.equipment_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = equipment_groups.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS equipment_groups_admin_update ON public.equipment_groups;
CREATE POLICY equipment_groups_admin_update
  ON public.equipment_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = equipment_groups.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = equipment_groups.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS equipment_groups_admin_delete ON public.equipment_groups;
CREATE POLICY equipment_groups_admin_delete
  ON public.equipment_groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = equipment_groups.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.touch_equipment_group_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipment_groups_updated_at ON public.equipment_groups;
CREATE TRIGGER trg_equipment_groups_updated_at
  BEFORE UPDATE ON public.equipment_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_equipment_group_updated_at();

CREATE OR REPLACE FUNCTION public.protect_equipment_group_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(trim(NEW.code));

  IF TG_OP = 'UPDATE'
     AND OLD.code IS DISTINCT FROM NEW.code
     AND OLD.next_sequence > 1 THEN
    RAISE EXCEPTION 'Equipment group code cannot be changed after a management code has been issued';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_equipment_group_code ON public.equipment_groups;
CREATE TRIGGER trg_protect_equipment_group_code
  BEFORE INSERT OR UPDATE OF code ON public.equipment_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_equipment_group_code();

CREATE OR REPLACE FUNCTION public.prevent_used_equipment_group_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.next_sequence > 1
     OR EXISTS (SELECT 1 FROM public.equipment e WHERE e.equipment_group_id = OLD.id) THEN
    RAISE EXCEPTION 'Equipment group has been used and cannot be deleted; deactivate it instead';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_used_equipment_group_delete ON public.equipment_groups;
CREATE TRIGGER trg_prevent_used_equipment_group_delete
  BEFORE DELETE ON public.equipment_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_used_equipment_group_delete();

CREATE OR REPLACE FUNCTION public.assign_equipment_management_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.equipment_groups%ROWTYPE;
  v_sequence bigint;
  v_prefix text;
BEGIN
  -- Once issued, the management code is immutable.
  IF TG_OP = 'UPDATE'
     AND OLD.management_code IS NOT NULL
     AND NEW.management_code IS DISTINCT FROM OLD.management_code THEN
    RAISE EXCEPTION 'Equipment management code cannot be changed after it is issued';
  END IF;

  -- Existing codes stay unchanged even if the classification changes later.
  IF NEW.management_code IS NOT NULL OR NEW.equipment_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_group
  FROM public.equipment_groups
  WHERE id = NEW.equipment_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipment group not found';
  END IF;

  IF v_group.organization_id <> NEW.organization_id THEN
    RAISE EXCEPTION 'Equipment group must belong to the same organization as the equipment';
  END IF;

  IF NOT v_group.is_active THEN
    RAISE EXCEPTION 'Inactive equipment groups cannot issue new management codes';
  END IF;

  v_sequence := v_group.next_sequence;

  UPDATE public.equipment_groups
  SET next_sequence = next_sequence + 1
  WHERE id = v_group.id;

  SELECT upper(trim(equipment_code_prefix))
  INTO v_prefix
  FROM public.organizations
  WHERE id = NEW.organization_id;

  NEW.management_code := concat(v_prefix, '-', v_group.code, '-', lpad(v_sequence::text, 6, '0'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_equipment_management_code ON public.equipment;
CREATE TRIGGER trg_assign_equipment_management_code
  BEFORE INSERT OR UPDATE OF equipment_group_id, management_code ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_equipment_management_code();

-- Include management-code/classification changes in the existing equipment audit trail.
CREATE OR REPLACE FUNCTION public.audit_equipment_classification_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb := '{}'::jsonb;
BEGIN
  IF OLD.equipment_group_id IS DISTINCT FROM NEW.equipment_group_id THEN
    v_changes := v_changes || jsonb_build_object(
      'equipment_group_id', jsonb_build_object('old', OLD.equipment_group_id, 'new', NEW.equipment_group_id)
    );
  END IF;

  IF OLD.management_code IS DISTINCT FROM NEW.management_code THEN
    v_changes := v_changes || jsonb_build_object(
      'management_code', jsonb_build_object('old', OLD.management_code, 'new', NEW.management_code)
    );
  END IF;

  IF v_changes <> '{}'::jsonb THEN
    PERFORM public.log_audit_entry(
      NEW.organization_id,
      'equipment',
      NEW.id,
      NEW.name,
      'UPDATE',
      v_changes,
      jsonb_build_object('source', 'equipment_classification')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_equipment_classification_trigger ON public.equipment;
CREATE TRIGGER audit_equipment_classification_trigger
  AFTER UPDATE OF equipment_group_id, management_code ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_equipment_classification_changes();

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_entity_type_check;
ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'equipment'::text,
    'work_order'::text,
    'inventory_item'::text,
    'preventative_maintenance'::text,
    'organization_member'::text,
    'team_member'::text,
    'team'::text,
    'pm_template'::text,
    'organization'::text,
    'equipment_group'::text
  ]));

CREATE OR REPLACE FUNCTION public.audit_equipment_group_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb := '{}'::jsonb;
  v_row public.equipment_groups%ROWTYPE;
BEGIN
  v_row := COALESCE(NEW, OLD);

  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object(
      'code', jsonb_build_object('old', NULL, 'new', NEW.code),
      'name', jsonb_build_object('old', NULL, 'new', NEW.name),
      'examples', jsonb_build_object('old', NULL, 'new', NEW.examples),
      'management_focus', jsonb_build_object('old', NULL, 'new', NEW.management_focus),
      'description', jsonb_build_object('old', NULL, 'new', NEW.description),
      'is_active', jsonb_build_object('old', NULL, 'new', NEW.is_active)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.code IS DISTINCT FROM NEW.code THEN
      v_changes := v_changes || jsonb_build_object('code', jsonb_build_object('old', OLD.code, 'new', NEW.code));
    END IF;
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.examples IS DISTINCT FROM NEW.examples THEN
      v_changes := v_changes || jsonb_build_object('examples', jsonb_build_object('old', OLD.examples, 'new', NEW.examples));
    END IF;
    IF OLD.management_focus IS DISTINCT FROM NEW.management_focus THEN
      v_changes := v_changes || jsonb_build_object('management_focus', jsonb_build_object('old', OLD.management_focus, 'new', NEW.management_focus));
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
    END IF;
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      v_changes := v_changes || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active));
    END IF;
    -- Internal sequence increments are implementation detail, not audit events.
    IF v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSE
    v_changes := jsonb_build_object(
      'code', jsonb_build_object('old', OLD.code, 'new', NULL),
      'name', jsonb_build_object('old', OLD.name, 'new', NULL)
    );
  END IF;

  PERFORM public.log_audit_entry(
    v_row.organization_id,
    'equipment_group',
    v_row.id,
    v_row.name,
    TG_OP,
    v_changes,
    jsonb_build_object('group_code', v_row.code)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_equipment_group_trigger ON public.equipment_groups;
CREATE TRIGGER audit_equipment_group_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_equipment_group_changes();

-- Seed CEV only. Other organizations can create their own classification master data.
INSERT INTO public.equipment_groups (
  organization_id, code, name, examples, management_focus, description
)
SELECT
  o.id,
  seed.code,
  seed.name,
  seed.examples,
  seed.management_focus,
  seed.description
FROM public.organizations o
CROSS JOIN (VALUES
  ('PE', 'Thiết bị sản xuất', 'Press, Mixer, Coating machine, Oven', 'Bảo trì, PM, giờ chạy', 'Thiết bị trực tiếp tham gia quá trình sản xuất.'),
  ('ME', 'Thiết bị đo / kiểm tra', 'Caliper, Micrometer, CMM, Pressure Gauge dùng để xác nhận chất lượng', 'Calibration, Verification, Traceability', 'Thiết bị dùng để đo, kiểm tra hoặc xác nhận chất lượng.'),
  ('TL', 'Tooling / Jig / Fixture', 'Khuôn, Jig, Fixture, Die, Checking Fixture', 'Tuổi thọ, bảo dưỡng, vị trí, tình trạng', 'Dụng cụ công nghệ, khuôn, jig và fixture phục vụ sản xuất hoặc kiểm tra.'),
  ('UT', 'Thiết bị phụ trợ / hạ tầng', 'Compressor, Chiller, HVAC, Generator, Air Dryer', 'PM, Inspection, Downtime', 'Thiết bị utility và hạ tầng hỗ trợ hoạt động nhà máy.'),
  ('MH', 'Thiết bị vận chuyển / Handling', 'Forklift, Pallet Truck, Crane, Hoist', 'Inspection, Maintenance, Safety', 'Thiết bị nâng hạ và vận chuyển vật liệu trong nhà máy.')
) AS seed(code, name, examples, management_focus, description)
WHERE o.name = 'CEV'
ON CONFLICT (organization_id, code) DO NOTHING;
