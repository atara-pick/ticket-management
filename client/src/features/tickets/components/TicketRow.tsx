import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicketStatus } from '../api/tickets.api';
import { formatTicketDate } from '../formatTicketDate';
import { ticketsKey } from '../hooks/useTickets';
import { statusLabels } from '../tickets.types';
import type { Ticket, TicketStatus } from '../tickets.types';
import styles from '../TicketsPage.module.css';

export function TicketRow({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();
  const mutationKey = ['ticket-status', ticket.id] as const;
  const updating = useIsMutating({ mutationKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (status: TicketStatus) => updateTicketStatus(ticket.id, status),
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: ticketsKey });
      await queryClient.invalidateQueries({ queryKey: ticketsKey });
    },
  });

  return (
    <tr>
      <td><bdi>{ticket.id}</bdi></td>
      <td><strong>{ticket.title}</strong><p className={styles.description}>{ticket.description || '-'}</p></td>
      <td><time dateTime={ticket.created_at} dir="ltr">{formatTicketDate(ticket.created_at)}</time></td>
      <td>
        <select aria-label={`סטטוס עבור ${ticket.title} (${ticket.id})`} value={ticket.status}
          disabled={updating} onChange={(event) => mutation.mutate(event.target.value as TicketStatus)}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {mutation.isError && <p className={styles.error} role="alert">עדכון הסטטוס נכשל. אפשר לנסות שוב.</p>}
      </td>
    </tr>
  );
}
