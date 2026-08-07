/**
 * Prisma CLI config for @nexus/db.
 *
 * Uses Prisma 6.10's `prisma.config.ts` so that migrations/seeds talk to the
 * BYPASSRLS migrator connection while the runtime ORM still uses the RLS-applied
 * app connection (schema datasource). Loads the repo-root `.env`.
 */
import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  seed: { command: 'tsx prisma/seed.ts' },
});