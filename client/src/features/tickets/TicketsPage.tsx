import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { CreateTicketForm } from './components/CreateTicketForm';
import { Pagination } from './components/Pagination';
import { TicketFilters } from './components/TicketFilters';
import { TicketsList } from './components/TicketsList';
import { ticketPageOptions, ticketsKey, useTickets } from './hooks/useTickets';
import type { Filters } from './tickets.types';
import styles from './TicketsPage.module.css';

const emptyFilters: Filters = { search: '', status: '' };

export function TicketsPage() {
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const query = useTickets(page, applied);
  const queryClient = useQueryClient();
  const heading = useRef<HTMLHeadingElement>(null);
  const totalPages = query.data?.totalPages;
  const validPage = totalPages === undefined ? page : Math.min(page, Math.max(1, totalPages));

  useEffect(() => {
    if (validPage !== page) setPage(validPage);
  }, [page, validPage]);

  function submitSearch() {
    const next = { ...draft, search: draft.search.trim() };
    if (page === 1 && next.search === applied.search && next.status === applied.status) {
      void query.refetch();
      return;
    }
    setApplied(next);
    setPage(1);
  }

  async function refreshAfterCreate() {
    // Cancel pre-creation reads before requesting the unfiltered first page.
    await queryClient.cancelQueries({ queryKey: ticketsKey });
    await queryClient.invalidateQueries({ queryKey: ticketsKey, refetchType: 'none' });
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
    await queryClient.prefetchQuery(ticketPageOptions(1, emptyFilters));
  }

  const changingPage = validPage !== page;
  return (
    <main className={styles.page}>
      <header className={styles.header}><h1>ניהול פניות שירות</h1></header>
      <TicketFilters draft={draft} onChange={setDraft} onSearch={submitSearch} />
      <div className={styles.layout}>
        <CreateTicketForm onCreated={refreshAfterCreate} />
        <section className={styles.panel} aria-labelledby="tickets-heading">
          <h2 id="tickets-heading" ref={heading} tabIndex={-1}>רשימת פניות</h2>
          <TicketsList
            tickets={query.data?.items ?? []}
            loading={query.isPending || changingPage}
            failed={query.isError}
            onRetry={() => void query.refetch()}
          />
          {query.data && !query.isError && !changingPage && (
            <Pagination page={page} totalPages={query.data.totalPages} onChange={(nextPage) => {
              heading.current?.focus();
              setPage(nextPage);
            }} />
          )}
        </section>
      </div>
    </main>
  );
}
