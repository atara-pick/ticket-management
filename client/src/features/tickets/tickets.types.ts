export const statusLabels = {
  open: 'פתוחה',
  in_progress: 'בטיפול',
  closed: 'סגורה',
} as const;

export type TicketStatus = keyof typeof statusLabels;

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  created_at: string;
}

export interface Filters {
  search: string;
  status: TicketStatus | '';
}

export interface TicketPage {
  items: Ticket[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type CreateTicket = Pick<Ticket, 'title' | 'description'>;
export type TicketFieldErrors = Partial<Record<keyof CreateTicket, string>>;
