-- Allow a seller to operate multiple stores (capped at 3 by the API).
-- Previously `Store.sellerId` was unique, enforcing a single store per seller.

-- Drop the one-store-per-seller unique constraint.
DROP INDEX "Store_sellerId_key";

-- Support lookups by seller filtered on soft-delete.
CREATE INDEX "Store_sellerId_deletedAt_idx" ON "Store"("sellerId", "deletedAt");
