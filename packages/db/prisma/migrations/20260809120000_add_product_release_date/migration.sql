-- Upcoming products: sellers can set a future release date.
-- Stores as TIMESTAMP(3) to match Prisma's DateTime mapping.
ALTER TABLE "Product" ADD COLUMN "releaseDate" TIMESTAMP(3);