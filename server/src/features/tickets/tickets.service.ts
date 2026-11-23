import type { createTicketRepository } from './tickets.repository.js';
import type { CreateTicket, TicketQuery } from './tickets.schemas.js';
import type { tickets } from '../../db/schema.js';

const PAGE_SIZE = 10;

export function createTicketService(repository: ReturnType<typeof createTicketRepository>) {
  return {
    list(query: TicketQuery) {
      return repository.list(query, PAGE_SIZE);
    },
    create(input: CreateTicket) {
      return repository.insert({ ...input, created_at: new Date() });
    },
    updateStatus(id: number, status: typeof tickets.$inferSelect.status) {
      return repository.updateStatus(id, status);
    },
  };
}
