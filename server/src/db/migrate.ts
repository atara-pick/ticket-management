import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { databasePath, migrationsPath } from '../config/env.js';
import { openDatabase } from './client.js';

const database = openDatabase(databasePath());
try {
  migrate(database.db, { migrationsFolder: migrationsPath });
  console.log('Database migrations applied.');
} finally {
  database.close();
}
