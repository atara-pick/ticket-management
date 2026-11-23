const ticketDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatTicketDate(timestamp: string) {
  return ticketDateFormatter.format(new Date(timestamp));
}
