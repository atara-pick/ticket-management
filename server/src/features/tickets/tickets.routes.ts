import { Router } from 'express';
import type { createTicketService } from './tickets.service.js';
import { createTicketSchema, listTicketsSchema, ticketIdSchema, updateStatusSchema } from './tickets.schemas.js';

export function createTicketRouter(service: ReturnType<typeof createTicketService>) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(service.list(listTicketsSchema.parse(req.query)));
  });

  router.post('/', (req, res) => {
    res.status(201).json(service.create(createTicketSchema.parse(req.body)));
  });

  router.patch('/:id/status', (req, res) => {
    const { id } = ticketIdSchema.parse(req.params);
    const { status } = updateStatusSchema.parse(req.body);
    const ticket = service.updateStatus(id, status);
    if (!ticket) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  });

  return router;
}
