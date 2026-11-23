import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TicketsPage } from './features/tickets/TicketsPage';
import './styles/global.css';

const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TicketsPage />
    </QueryClientProvider>
  </StrictMode>,
);
