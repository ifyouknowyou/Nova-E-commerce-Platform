-- NEXUS OS — allow redeeming a verification/reset token by its unguessable hash
-- on PUBLIC routes (no user claim exists yet). token_hash is 32 random bytes, so
-- "rows whose token_hash = current_setting('app.verify_token')" only exposes the
-- row to someone holding the exact token.
DROP POLICY IF EXISTS verify_token_lookup ON "verification_tokens";
CREATE POLICY verify_token_lookup ON "verification_tokens"
  FOR SELECT
  USING (token_hash = NULLIF(current_setting('app.verify_token', true), ''));
