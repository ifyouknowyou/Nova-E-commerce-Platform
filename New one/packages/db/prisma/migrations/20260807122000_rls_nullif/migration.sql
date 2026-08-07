-- NEXUS OS — RLS policy hardening.
--
-- Bug: current_setting('app.org', true) returns '' (empty string) when a custom
-- GUC is unset, NOT NULL. Casting ''::uuid throws 22P02 and an erroring policy
-- aborts the whole query. Every cast must go through NULLIF(current_setting(...),
-- '') so unset/empty claims become NULL and their policy yields false (fail closed)
-- instead of crashing. Because Postgres ORs all applicable policies for a table,
-- an unrelated policy that casts an unset GUC would leak through onto org queries.

DROP POLICY IF EXISTS org_scope_all ON "organization_members";
DROP POLICY IF EXISTS self_read_memberships ON "organization_members";
DROP POLICY IF EXISTS org_scope_all ON "roles";
DROP POLICY IF EXISTS permissions_read_all ON "permissions";
DROP POLICY IF EXISTS role_perm_org ON "role_permissions";
DROP POLICY IF EXISTS membership_role_org ON "membership_roles";
DROP POLICY IF EXISTS org_scope_all ON "sessions";
DROP POLICY IF EXISTS org_scope_all ON "settings";
DROP POLICY IF EXISTS org_scope_all ON "audit_logs";
DROP POLICY IF EXISTS org_scope_all ON "notifications";
DROP POLICY IF EXISTS org_scope_all ON "api_keys";

-- organization_members: org-scope + self-read for sign-in. Both casts NULLIF'd.
CREATE POLICY org_scope_all ON "organization_members"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
CREATE POLICY self_read_memberships ON "organization_members"
  FOR SELECT
  USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

-- roles
CREATE POLICY org_scope_all ON "roles"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

-- permissions (global catalogue, readable only when a tenant context is active)
CREATE POLICY permissions_read_all ON "permissions"
  FOR SELECT
  USING (NULLIF(current_setting('app.org', true), '') IS NOT NULL);

-- role_permissions
CREATE POLICY role_perm_org ON "role_permissions"
  USING (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = NULLIF(current_setting('app.org', true), '')::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = NULLIF(current_setting('app.org', true), '')::uuid
  ));

-- membership_roles
CREATE POLICY membership_role_org ON "membership_roles"
  USING (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = NULLIF(current_setting('app.org', true), '')::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = NULLIF(current_setting('app.org', true), '')::uuid
  ));

-- sessions, settings, audit_logs, notifications, api_keys
CREATE POLICY org_scope_all ON "sessions"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

CREATE POLICY org_scope_all ON "settings"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

CREATE POLICY org_scope_all ON "audit_logs"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

CREATE POLICY org_scope_all ON "notifications"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

CREATE POLICY org_scope_all ON "api_keys"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);