import { statusLabels } from '../tickets.types';
import type { Filters } from '../tickets.types';
import styles from '../TicketsPage.module.css';

interface Props {
  draft: Filters;
  onChange: (filters: Filters) => void;
  onSearch: () => void;
}

export function TicketFilters({ draft, onChange, onSearch }: Props) {
  return (
    <form className={styles.filters} role="search" aria-label="חיפוש פניות" onSubmit={(event) => {
      event.preventDefault();
      onSearch();
    }}>
      <label>
        חיפוש בכותרת
        <input type="search" value={draft.search} onChange={(event) => onChange({ ...draft, search: event.target.value })} />
      </label>
      <label>
        סינון לפי סטטוס
        <select value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as Filters['status'] })}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="submit">חפש</button>
    </form>
  );
}
