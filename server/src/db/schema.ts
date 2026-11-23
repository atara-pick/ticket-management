import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const statuses = ['open', 'in_progress', 'closed'] as const;

export const tickets = sqliteTable('tickets', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  description: text().notNull().default(''),
  status: text({ enum: statuses }).notNull().default('open'),
  created_at: integer({ mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  check('tickets_valid_status', sql`${table.status} in ('open', 'in_progress', 'closed')`),
]);
