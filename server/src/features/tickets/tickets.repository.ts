import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { TicketDatabase } from '../../db/client.js';
import { tickets } from '../../db/schema.js';
import type { TicketQuery } from './tickets.schemas.js';

export function createTicketRepository(db: TicketDatabase) {
  return {
    list({ page, search, status }: TicketQuery, pageSize: number) {
      const filter = and(
        search ? sql`instr(${tickets.title}, ${search}) > 0` : undefined,
        status ? eq(tickets.status, status) : undefined,
      );

      return db.transaction((tx) => {
        const { total } = tx.select({ total: count() }).from(tickets).where(filter).get()!;
        const totalPages = Math.ceil(total / pageSize);
        const items = page > totalPages ? [] : tx.select().from(tickets).where(filter)
          .orderBy(desc(tickets.created_at), desc(tickets.id))
          .limit(pageSize).offset((page - 1) * pageSize).all();

        return { items, page, pageSize, total, totalPages };
      });
    },

    insert(ticket: Pick<typeof tickets.$inferInsert, 'title' | 'description' | 'created_at'>) {
      return db.insert(tickets).values(ticket).returning().get();
    },

    updateStatus(id: number, status: typeof tickets.$inferSelect.status) {
      return db.update(tickets).set({ status }).where(eq(tickets.id, id)).returning().get();
    },
  };
}
