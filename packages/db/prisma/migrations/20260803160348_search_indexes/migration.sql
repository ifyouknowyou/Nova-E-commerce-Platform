-- Search optimization: trigram index for substring/fuzzy search,
-- and a GIN full-text index over product name + description.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_search_trgm"
  ON "Product" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_search_fts"
  ON "Product" USING GIN (to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", '')));
