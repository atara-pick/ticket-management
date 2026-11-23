import type { CreateTicket, Filters, Ticket, TicketFieldErrors, TicketPage, TicketStatus } from '../tickets.types';

const path = '/api/tickets';

export class TicketRequestError extends Error {
  constructor(public status: number, public fieldErrors?: TicketFieldErrors) {
    super(`Ticket request failed with HTTP ${status}`);
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new TicketRequestError(response.status, body?.fieldErrors);
  }
  return response.json() as Promise<T>;
}

export function listTickets(page: number, { search, status }: Filters, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  return request<TicketPage>(`${path}?${query}`, { signal });
}

export function createTicket(ticket: CreateTicket) {
  return request<Ticket>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });
}

export function updateTicketStatus(id: number, status: TicketStatus) {
  return request<Ticket>(`${path}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
