-- Backfill: one Organization per existing Store, owned by the store's seller,
-- plus an ACTIVE ORG_OWNER membership for that seller. Idempotent so re-running
-- the migration is safe.
DO $$
DECLARE
  s RECORD;
  org_id TEXT;
  base_slug TEXT;
  final_slug TEXT;
  n INT;
BEGIN
  FOR s IN SELECT id, "sellerId", name, slug FROM "Store" WHERE "deletedAt" IS NULL LOOP
    -- Skip if a membership already links this seller to an org for this store.
    IF EXISTS (
      SELECT 1 FROM "OrganizationMembership" om
      JOIN "Organization" o ON o.id = om."organizationId"
      WHERE o."ownerId" = s."sellerId"
    ) THEN
      -- Ensure Store.organizationId is set to that org.
      SELECT o.id INTO org_id FROM "Organization" o
      WHERE o."ownerId" = s."sellerId" LIMIT 1;
      IF org_id IS NOT NULL AND s.id IS NOT NULL THEN
        UPDATE "Store" SET "organizationId" = org_id WHERE id = s.id AND "organizationId" IS NULL;
      END IF;
      CONTINUE;
    END IF;

    base_slug := s.slug;
    final_slug := base_slug;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "Organization" WHERE slug = final_slug) LOOP
      n := n + 1;
      final_slug := base_slug || '-' || n;
    END LOOP;

    INSERT INTO "Organization" (id, "ownerId", name, slug, status, plan, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), s."sellerId", s.name, final_slug, 'ACTIVE', 'starter', now(), now())
    RETURNING id INTO org_id;

    INSERT INTO "OrganizationMembership" (
      id, "organizationId", "userId", "roleCodes", status, "invitedBy", "joinedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), org_id, s."sellerId", ARRAY['ORG_OWNER'], 'ACTIVE', s."sellerId", now(), now(), now()
    );

    UPDATE "Store" SET "organizationId" = org_id WHERE id = s.id;
  END LOOP;
END $$;
