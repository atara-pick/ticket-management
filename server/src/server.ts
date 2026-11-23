import { createApp } from './app.js';
import { databasePath, serverPort } from './config/env.js';
import { openDatabase } from './db/client.js';
import { tickets } from './db/schema.js';

function start() {
  const port = serverPort();
  const database = openDatabase(databasePath(), true);
  try {
    // Prepare a query to verify the migrated table and its columns before listening.
    database.db.select().from(tickets).limit(1).get();
    const server = createApp(database.db).listen(port, () => {
      console.log(`Ticket API listening at http://localhost:${port}`);
    });
    server.once('error', (error) => {
      database.close();
      console.error('Could not listen:', error.message);
      process.exitCode = 1;
    });
    const stop = () => server.close(() => database.close());
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    database.close();
    throw error;
  }
}

try {
  start();
} catch (error) {
  console.error('Could not start the ticket API. Check configuration and run the database migrations.', error);
  process.exitCode = 1;
}
