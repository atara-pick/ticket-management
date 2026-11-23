import { queryOptions, useQuery } from '@tanstack/react-query';
import { listTickets } from '../api/tickets.api';
import type { Filters } from '../tickets.types';

export const ticketsKey = ['tickets'] as const;

export function ticketPageOptions(page: number, filters: Filters) {
  return queryOptions({
    queryKey: [...ticketsKey, page, filters.search, filters.status],
    queryFn: ({ signal }) => listTickets(page, filters, signal),
    retry: false,
  });
}

export function useTickets(page: number, filters: Filters) {
  return useQuery(ticketPageOptions(page, filters));
}
