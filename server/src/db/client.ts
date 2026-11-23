import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export function openDatabase(path: string, fileMustExist = false) {
  if (!fileMustExist) mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path, { fileMustExist });
  try {
    sqlite.pragma('journal_mode = WAL');
    return { db: drizzle(sqlite), close: () => sqlite.close() };
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

export type TicketDatabase = ReturnType<typeof openDatabase>['db'];
