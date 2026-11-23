import express from 'express';
import type { TicketDatabase } from './db/client.js';
import { createTicketRepository } from './features/tickets/tickets.repository.js';
import { createTicketRouter } from './features/tickets/tickets.routes.js';
import { createTicketService } from './features/tickets/tickets.service.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp(db: TicketDatabase) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api/tickets', createTicketRouter(createTicketService(createTicketRepository(db))));
  app.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' });
  });
  app.use(errorHandler);
  return app;
}
