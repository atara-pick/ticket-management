import { databasePath } from '../config/env.js';
import { openDatabase } from './client.js';
import { seedTickets } from './seed.js';

const database = openDatabase(databasePath(), true);
try {
  const { inserted, total } = seedTickets(database.db);
  console.log(`Inserted ${inserted} of ${total} sample tickets.`);
} finally {
  database.close();
}
