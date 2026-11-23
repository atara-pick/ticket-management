import { z } from 'zod';
import { statuses } from '../../db/schema.js';

const positiveInteger = z.string().regex(/^[1-9][0-9]*$/).transform(Number)
  .pipe(z.number().int().positive());

export const listTicketsSchema = z.object({
  page: positiveInteger.default(1),
  search: z.string().trim().optional(),
  status: z.enum(statuses).optional(),
}).strict();

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'Title must contain 3–100 characters')
    .max(100, 'Title must contain 3–100 characters'),
  description: z.string().max(2000).optional(),
}).strict();

export const updateStatusSchema = z.object({ status: z.enum(statuses) }).strict();
export const ticketIdSchema = z.object({
  id: z.string().regex(/^-?[1-9][0-9]*$/).transform(Number).pipe(z.number().int()),
});

export type TicketQuery = z.infer<typeof listTicketsSchema>;
export type CreateTicket = z.infer<typeof createTicketSchema>;
