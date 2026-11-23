import styles from '../TicketsPage.module.css';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <nav className={styles.pagination} aria-label="דפדוף פניות">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>הקודם</button>
      <span aria-live="polite">עמוד {page} מתוך {Math.max(1, totalPages)}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>הבא</button>
    </nav>
  );
}
