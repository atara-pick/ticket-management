import type { Ticket } from '../tickets.types';
import { TicketRow } from './TicketRow';
import styles from '../TicketsPage.module.css';

interface Props {
  tickets: Ticket[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

export function TicketsList({ tickets, loading, failed, onRetry }: Props) {
  if (loading) return <p className={styles.feedback} role="status">טוען פניות…</p>;
  if (failed) {
    return (
      <div className={styles.feedback}>
        <p className={styles.error} role="alert">לא הצלחנו לטעון את הפניות.</p>
        <button type="button" onClick={onRetry}>נסה שוב</button>
      </div>
    );
  }
  if (tickets.length === 0) return <p className={styles.feedback} role="status">לא נמצאו פניות</p>;

  return (
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="טבלת פניות">
      <table aria-label="פניות שירות">
        <thead><tr>
          <th scope="col">מספר</th>
          <th scope="col">כותרת</th>
          <th scope="col">תאריך יצירה</th>
          <th scope="col">סטטוס</th>
        </tr></thead>
        <tbody>{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</tbody>
      </table>
    </div>
  );
}
