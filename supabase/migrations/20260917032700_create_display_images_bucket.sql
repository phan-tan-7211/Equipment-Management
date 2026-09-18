-- =============================================================================
-- Public immutable display-image storage contract (Phase 2)
--
-- The bucket is public for anonymous object GETs only. Upload and delete remain
-- restricted to authenticated users who belong to the organization encoded in
-- the object path.
--
-- Object layout:
--   org/{organizationId}/{equipment|inventory}/{entityId}/{imageSetId}/{variant}.webp
--
-- No UPDATE policy is installed intentionally. Replacing an image set must use
-- a new imageSetId and a non-upsert upload, which keeps every object immutable.
-- =============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'display-images',
  'display-images',
  true,
  10485760,
  ARRAY['image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public buckets do not need a SELECT policy for direct object GETs. Leaving
-- SELECT unconfigured also keeps anonymous object listing closed.

DROP POLICY IF EXISTS "display_images_insert" ON storage.objects;
CREATE POLICY "display_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'display-images'
    AND array_length(storage.foldername(name), 1) = 5
    AND (storage.foldername(name))[1] = 'org'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] IN ('equipment', 'inventory')
    AND (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[5] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND storage.filename(name) IN ('thumb.webp', 'preview.webp', 'full.webp')
    AND CASE
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        public.is_org_member(
          (SELECT auth.uid()),
          ((storage.foldername(name))[2])::uuid
        )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "display_images_delete" ON storage.objects;
CREATE POLICY "display_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'display-images'
    AND array_length(storage.foldername(name), 1) = 5
    AND (storage.foldername(name))[1] = 'org'
    AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] IN ('equipment', 'inventory')
    AND (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[5] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND storage.filename(name) IN ('thumb.webp', 'preview.webp', 'full.webp')
    AND CASE
      WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        public.is_org_member(
          (SELECT auth.uid()),
          ((storage.foldername(name))[2])::uuid
        )
      ELSE false
    END
  );
