-- NEXUS OS — allow accepting an invite by its unguessable token BEFORE an org
-- claim exists. The token hash is high-entropy, so exposing "rows whose
-- token_hash = current_setting('app.invite_token')" is safe: you must hold the
-- token to see the row. Combined (OR) with the org-scope policy for members.
DROP POLICY IF EXISTS invite_token_lookup ON "invitations";
CREATE POLICY invite_token_lookup ON "invitations"
  FOR SELECT
  USING (token_hash = NULLIF(current_setting('app.invite_token', true), ''));
