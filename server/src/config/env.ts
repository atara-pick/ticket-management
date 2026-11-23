import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const defaultDatabasePath = fileURLToPath(new URL('../../data/tickets.sqlite', import.meta.url));
export const migrationsPath = fileURLToPath(new URL('../../drizzle/', import.meta.url));

export function databasePath() {
  return z.string().trim().min(1).parse(process.env.DATABASE_PATH ?? defaultDatabasePath);
}

export function serverPort() {
  return z.coerce.number().int().min(1).max(65535).parse(process.env.PORT ?? 3000);
}
