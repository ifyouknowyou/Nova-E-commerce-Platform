-- NEXUS OS — allow rotating/revoking a refresh session by its raw token id.
--
-- `sessions` rows are RLS-scoped to `app.org`, but refresh rotation and sign-out
-- happen on PUBLIC routes where no org claim exists yet — the caller only holds
-- the refresh cookie (the session's id, a high-entropy uuid). Without a policy,
-- RLS hides every row and rotate()/revoke() silently no-op.
--
-- The session id IS the token (32 random bytes), so "rows whose id equals the
-- caller's app.session_token" only exposes a row to someone holding the exact
-- refresh token — same trust model as verify_token_lookup. This is a SELECT-only
-- policy; writes stay org-scoped.
DROP POLICY IF EXISTS session_token_lookup ON "sessions";
CREATE POLICY session_token_lookup ON "sessions"
  FOR SELECT
  USING (id = NULLIF(current_setting('app.session_token', true), '')::uuid);
