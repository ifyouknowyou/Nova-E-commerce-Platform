-- NEXUS OS — PostgreSQL bootstrap (runs once when the volume is first created).
--
-- Role design (upgrade Decision 1 — multi-tenancy via Postgres RLS):
--   * nexus_migrate  — created by POSTGRES_USER in docker-compose as the DB
--                      owner/superuser; runs Prisma migrations + seeds and sets
--                      policies. As superuser it bypasses RLS, as required.
--   * nexus_app       — the runtime role the NestJS API connects as. It is subject
--                      to ROW LEVEL SECURITY on every tenant-scoped table. It owns
--                      NO tenant data; it sees rows only when Postgres evaluates
--                      current_setting('app.org') against each row's org_id
--                      (fail closed: empty/unset org ⇒ zero rows).
--
-- The API's per-request tenant claim is set via:
--   SELECT set_config('app.org', <org_id> , true)   -- true => transaction-local, never leaks.
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_app') THEN
      CREATE ROLE nexus_app LOGIN PASSWORD 'nexus_dev_password';
   END IF;
END
$$;

-- nexus_app: login role for the API. Must never bypass RLS.
ALTER ROLE nexus_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE nexus_app WITH PASSWORD 'nexus_dev_password';

GRANT CONNECT ON DATABASE nexus_os TO nexus_app;
GRANT USAGE ON SCHEMA public TO nexus_app;

-- Full DML access is granted per-table in the migration (01_init.sql) so that
-- tenant tables remain readable while platform tables stay locked down to the API.
-- Sequences are granted structurally so the app can read/insert normally.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_app;
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_migrate IN SCHEMA public
   GRANT USAGE, SELECT ON SEQUENCES TO nexus_app;