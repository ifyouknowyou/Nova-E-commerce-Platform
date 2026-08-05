-- Auth hardening + schema drift reconciliation.
-- The Prisma schema declares these columns / enum value but no earlier migration
-- created them, so a fresh `prisma migrate deploy` produced a DB that diverged
-- from the generated client (registration / email verification would crash with
-- "column does not exist"). `IF NOT EXISTS` keeps this safe on databases that
-- were previously synced out-of-band.

-- Email verification code + expiry (used by auth.service verifyEmail).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3);

-- Token version: bumped on password change / status change / logout-all so
-- previously-issued access tokens are rejected immediately.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- PaymentProvider enum: the schema includes MOCK (dev/test provider fallback)
-- but the init migration created only (STRIPE, PAYPAL).
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MOCK';
