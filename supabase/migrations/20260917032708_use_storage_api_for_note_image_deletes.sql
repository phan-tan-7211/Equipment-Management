-- Fix Storage deletion for equipment/work-order note images.
--
-- Supabase Storage objects must be removed through the Storage API. The
-- metadata RPCs remain responsible for authorization, metadata deletion, and
-- audit logging, and return the stored path for the client-side Storage API
-- cleanup.

CREATE OR REPLACE FUNCTION public.delete_equipment_note_image_audited(
  p_organization_id uuid,
  p_equipment_id uuid,
  p_image_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_image public.equipment_note_images%ROWTYPE;
  v_note public.equipment_notes%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = v_user_id
      AND om.status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT ei.* INTO v_image
  FROM public.equipment_note_images ei
  JOIN public.equipment_notes en ON en.id = ei.equipment_note_id
  JOIN public.equipment e ON e.id = en.equipment_id
  WHERE ei.id = p_image_id
    AND en.equipment_id = p_equipment_id
    AND e.organization_id = p_organization_id
  FOR UPDATE OF ei;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Image not found');
  END IF;

  SELECT en.* INTO v_note
  FROM public.equipment_notes en
  JOIN public.equipment e ON e.id = en.equipment_id
  WHERE en.id = v_image.equipment_note_id
    AND en.equipment_id = p_equipment_id
    AND e.organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Note not found');
  END IF;

  IF NOT (
    public.is_org_admin(v_user_id, p_organization_id)
    OR public.is_equipment_team_manager(v_user_id, p_equipment_id)
    OR public.can_edit_equipment_note(v_user_id, p_organization_id, p_equipment_id, v_note.id)
    OR v_image.uploaded_by = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  DELETE FROM public.equipment_note_images WHERE id = p_image_id;

  PERFORM public.log_audit_entry(
    p_organization_id,
    'equipment',
    p_equipment_id,
    (SELECT e.name FROM public.equipment e WHERE e.id = p_equipment_id),
    'DELETE',
    jsonb_build_object('image_file_name', v_image.file_name),
    jsonb_build_object('note_id', v_note.id, 'image_id', p_image_id, 'source', 'equipment_note_image_delete')
  );

  RETURN jsonb_build_object(
    'success', true,
    'image_id', p_image_id,
    'storage_path', v_image.file_url
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Failed to delete image: ' || SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_work_order_note_image_audited(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_image_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_image public.work_order_images%ROWTYPE;
  v_note_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = v_user_id
      AND om.status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT wi.* INTO v_image
  FROM public.work_order_images wi
  JOIN public.work_orders wo ON wo.id = wi.work_order_id
  WHERE wi.id = p_image_id
    AND wi.work_order_id = p_work_order_id
    AND wo.organization_id = p_organization_id
  FOR UPDATE OF wi;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Image not found');
  END IF;

  v_note_id := v_image.note_id;

  IF NOT (
    public.is_org_admin(v_user_id, p_organization_id)
    OR public.is_work_order_team_manager(v_user_id, p_work_order_id)
    OR (v_note_id IS NOT NULL AND public.can_edit_work_order_note(v_user_id, p_organization_id, p_work_order_id, v_note_id))
    OR v_image.uploaded_by = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  DELETE FROM public.work_order_images WHERE id = p_image_id;

  PERFORM public.log_audit_entry(
    p_organization_id,
    'work_order',
    p_work_order_id,
    (SELECT wo.title FROM public.work_orders wo WHERE wo.id = p_work_order_id),
    'DELETE',
    jsonb_build_object('image_file_name', v_image.file_name),
    jsonb_build_object('note_id', v_note_id, 'image_id', p_image_id, 'source', 'work_order_note_image_delete')
  );

  RETURN jsonb_build_object(
    'success', true,
    'image_id', p_image_id,
    'storage_path', v_image.file_url
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Failed to delete image: ' || SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_equipment_note_image_audited(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_work_order_note_image_audited(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_equipment_note_image_audited(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_work_order_note_image_audited(uuid, uuid, uuid) TO authenticated;
