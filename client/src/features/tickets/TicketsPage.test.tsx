// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TicketsPage } from './TicketsPage';
import type { Ticket, TicketPage } from './tickets.types';

const example: Ticket = {
  id: 1, title: 'חשבונית חסרה', description: '', status: 'open', created_at: '2025-01-01T10:30:00.000Z',
};
const fetchMock = vi.fn<typeof fetch>();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function result(items: Ticket[] = [example], page = 1, total = items.length) {
  return json({ items, page, pageSize: 10, total, totalPages: Math.ceil(total / 10) } satisfies TicketPage);
}

function deferred() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((finish) => { resolve = finish; });
  return { promise, resolve };
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, refetchOnWindowFocus: false } } });
  render(<QueryClientProvider client={client}><TicketsPage /></QueryClientProvider>);
  return userEvent.setup();
}

const search = () => screen.getByRole<HTMLInputElement>('searchbox');
const filter = () => screen.getByRole<HTMLSelectElement>('combobox', { name: 'סינון לפי סטטוס' });
const button = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name });
const title = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'כותרת' });
const description = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: /תיאור/ });
const status = () => screen.getByRole<HTMLSelectElement>('combobox', { name: /סטטוס עבור/ });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('renders every creation date as dd/MM/yyyy with left-to-right ordering', async () => {
  const firstDate = new Date(2026, 10, 22, 16, 15).toISOString();
  const secondDate = new Date(2026, 0, 5, 9, 30).toISOString();
  fetchMock.mockResolvedValueOnce(result([
    { ...example, created_at: firstDate },
    { ...example, id: 2, created_at: secondDate },
  ]));
  setup();

  const dates = await screen.findAllByRole('time');
  expect(dates.map((date) => date.textContent)).toEqual(['22/11/2026', '05/01/2026']);
  expect(dates.map((date) => date.getAttribute('dir'))).toEqual(['ltr', 'ltr']);
  expect(dates.map((date) => date.getAttribute('datetime'))).toEqual([firstDate, secondDate]);
});

it('applies filters only on click or Enter, preserves applied filters in pagination, and resets page on search', async () => {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input), 'http://localhost');
    return result([example], Number(url.searchParams.get('page')), 22);
  });
  const user = setup();
  await screen.findByText(example.title);
  expect(button('הקודם').disabled).toBe(true);

  await user.type(search(), 'abc');
  await user.selectOptions(filter(), 'open');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await user.click(button('חפש'));
  await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets?page=1&search=abc&status=open', expect.anything()));
  await screen.findByText('עמוד 1 מתוך 3');

  await user.clear(search());
  await user.type(search(), 'new');
  await user.selectOptions(filter(), 'closed');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await user.click(button('הבא'));
  await screen.findByText('עמוד 2 מתוך 3');
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'רשימת פניות' }));
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets?page=2&search=abc&status=open', expect.anything());

  await user.type(search(), '{Enter}');
  await screen.findByText('עמוד 1 מתוך 3');
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets?page=1&search=new&status=closed', expect.anything());
});

it('shows field errors and blocks invalid creation', async () => {
  fetchMock.mockResolvedValueOnce(result());
  const user = setup();
  await user.type(title(), ' a ');
  await user.click(button('צור פנייה'));
  expect((await screen.findByRole('alert')).textContent).toContain('3 עד 100');
  expect(title().getAttribute('aria-invalid')).toBe('true');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('preserves both form fields when creation fails', async () => {
  fetchMock.mockResolvedValueOnce(result()).mockRejectedValueOnce(new TypeError('Network error'));
  const user = setup();
  await user.type(title(), 'New ticket');
  await user.type(description(), 'Keep this note');
  await user.click(button('צור פנייה'));
  expect((await screen.findByRole('alert')).textContent).toContain('לא ניתן היה לאשר');
  expect(title().value).toBe('New ticket');
  expect(description().value).toBe('Keep this note');
  expect(button('צור פנייה').disabled).toBe(false);
});

it('disables pending creation and resets form, filters and page after confirmation', async () => {
  const creation = deferred();
  const created = { ...example, id: 2, title: 'New ticket', description: 'New description' };
  fetchMock.mockResolvedValueOnce(result())
    .mockResolvedValueOnce(result([example], 1, 11))
    .mockResolvedValueOnce(result([example], 2, 11))
    .mockReturnValueOnce(creation.promise)
    .mockResolvedValue(result([created, example]));
  const user = setup();
  await screen.findByText(example.title);
  await user.type(search(), 'abc');
  await user.selectOptions(filter(), 'open');
  await user.click(button('חפש'));
  await screen.findByText('עמוד 1 מתוך 2');
  await user.click(button('הבא'));
  await screen.findByText('עמוד 2 מתוך 2');
  await user.type(title(), ' New ticket ');
  await user.type(description(), 'New description');
  await user.click(button('צור פנייה'));
  expect(button('שומר פנייה…').disabled).toBe(true);
  fireEvent.submit(title().form!);
  expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  expect(screen.queryByText('New ticket')).toBeNull();
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ title: 'New ticket', description: 'New description' }),
  }));
  creation.resolve(json(created, 201));
  await screen.findByText('הפנייה נשמרה.');
  expect(title().value).toBe('');
  expect(description().value).toBe('');
  expect(search().value).toBe('');
  expect(filter().value).toBe('');
  expect(screen.getByText('עמוד 1 מתוך 1')).toBeTruthy();
  expect(within(screen.getAllByRole('row')[1]).getByText('New ticket')).toBeTruthy();
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets?page=1', expect.anything());
});

it('sends status immediately and retains the confirmed value when the update fails', async () => {
  const update = deferred();
  fetchMock.mockResolvedValueOnce(result()).mockReturnValueOnce(update.promise);
  const user = setup();
  await screen.findByText(example.title);
  await user.selectOptions(status(), 'in_progress');
  await waitFor(() => expect(status().disabled).toBe(true));
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets/1/status', expect.objectContaining({
    method: 'PATCH', body: JSON.stringify({ status: 'in_progress' }),
  }));
  expect(status().value).toBe('open');
  update.resolve(json({ code: 'INTERNAL_ERROR' }, 500));
  expect((await screen.findByRole('alert')).textContent).toContain('עדכון הסטטוס נכשל');
  expect(status().value).toBe('open');
  expect(status().disabled).toBe(false);
});

it('refreshes applied filters after a status change and returns from an invalid last page', async () => {
  const remaining = { ...example, id: 2, title: 'פנייה אחרת' };
  fetchMock.mockResolvedValueOnce(result())
    .mockResolvedValueOnce(result([remaining], 1, 11))
    .mockResolvedValueOnce(result([example], 2, 11))
    .mockResolvedValueOnce(json({ ...example, status: 'closed' }))
    .mockResolvedValueOnce(result([], 2, 10))
    .mockResolvedValueOnce(result([remaining], 1, 10));
  const user = setup();
  await screen.findByText(example.title);
  await user.selectOptions(filter(), 'open');
  await user.click(button('חפש'));
  await screen.findByText('עמוד 1 מתוך 2');
  await user.click(button('הבא'));
  await screen.findByText('עמוד 2 מתוך 2');
  await user.selectOptions(status(), 'closed');
  await screen.findByText('עמוד 1 מתוך 1');
  expect(screen.queryByText(example.title)).toBeNull();
  expect(button('הבא').disabled).toBe(true);
  expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/tickets?page=2&status=open', expect.anything());
  expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/tickets?page=1&status=open', expect.anything());
});

it('shows loading followed by the empty state while keeping creation available', async () => {
  const pending = deferred();
  fetchMock.mockReturnValueOnce(pending.promise);
  setup();
  expect(screen.getByText('טוען פניות…')).toBeTruthy();
  pending.resolve(result([]));
  expect(await screen.findByText('לא נמצאו פניות')).toBeTruthy();
  expect(button('צור פנייה').disabled).toBe(false);
});

it('retries a failed list request with the same applied filters and page', async () => {
  fetchMock.mockResolvedValueOnce(result()).mockResolvedValueOnce(result([example], 1, 11))
    .mockResolvedValueOnce(json({}, 500)).mockResolvedValueOnce(result([example], 2, 11));
  const user = setup();
  await screen.findByText(example.title);
  await user.type(search(), 'abc{Enter}');
  await screen.findByText('עמוד 1 מתוך 2');
  await user.click(button('הבא'));
  await screen.findByRole('alert');
  await user.clear(search());
  await user.click(button('נסה שוב'));
  await screen.findByText('עמוד 2 מתוך 2');
  expect(fetchMock).toHaveBeenLastCalledWith('/api/tickets?page=2&search=abc', expect.anything());
});

it('aborts superseded requests and ignores a delayed response for old filters', async () => {
  const old = deferred();
  fetchMock.mockResolvedValueOnce(result()).mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(result([{ ...example, title: 'תוצאה עדכנית' }]));
  const user = setup();
  await screen.findByText(example.title);
  await user.type(search(), 'old{Enter}');
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const signal = fetchMock.mock.calls[1][1]?.signal;
  await user.clear(search());
  await user.type(search(), 'new{Enter}');
  await screen.findByText('תוצאה עדכנית');
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    old.resolve(result([{ ...example, title: 'תוצאה קודמת' }]));
    await old.promise;
  });
  expect(screen.queryByText('תוצאה קודמת')).toBeNull();
  expect(screen.getByText('תוצאה עדכנית')).toBeTruthy();
});

it('rejects descriptions longer than 2,000 characters before sending the form', async () => {
  fetchMock.mockResolvedValueOnce(result());
  const user = setup();
  await screen.findByText(example.title);
  await user.type(title(), 'Valid title');
  fireEvent.change(description(), { target: { value: 'a'.repeat(2001) } });
  await user.click(button('צור פנייה'));
  expect((await screen.findByRole('alert')).textContent).toContain('2,000');
  expect(description().getAttribute('aria-invalid')).toBe('true');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('keeps a pending status selector disabled when the ticket is displayed under a new search', async () => {
  const update = deferred();
  const updated = { ...example, status: 'closed' } satisfies Ticket;
  fetchMock.mockResolvedValueOnce(result())
    .mockReturnValueOnce(update.promise)
    .mockResolvedValueOnce(result())
    .mockResolvedValueOnce(result([updated]));
  const user = setup();
  await screen.findByText(example.title);
  await user.selectOptions(status(), 'closed');
  await waitFor(() => expect(status().disabled).toBe(true));

  await user.type(search(), 'new{Enter}');
  await screen.findByText(example.title);
  expect(status().disabled).toBe(true);

  update.resolve(json(updated));
  await waitFor(() => expect(status().value).toBe('closed'));
  await waitFor(() => expect(status().disabled).toBe(false));
});
