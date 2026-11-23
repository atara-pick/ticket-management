import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createTicket, TicketRequestError } from '../api/tickets.api';
import type { TicketFieldErrors } from '../tickets.types';
import styles from '../TicketsPage.module.css';

const titleError = 'יש להזין כותרת באורך 3 עד 100 תווים';
const descriptionError = 'אפשר להזין עד 2,000 תווים בתיאור';

export function CreateTicketForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<TicketFieldErrors>({});
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: createTicket,
    retry: false,
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      await onCreated();
    },
    onError: (error) => {
      if (error instanceof TicketRequestError && error.fieldErrors) {
        setErrors({
          title: error.fieldErrors.title ? titleError : undefined,
          description: error.fieldErrors.description ? descriptionError : undefined,
        });
      }
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    mutation.reset();
    const trimmed = title.trim();
    const nextErrors: TicketFieldErrors = {
      title: trimmed.length < 3 || trimmed.length > 100 ? titleError : undefined,
      description: description.length > 2000 ? descriptionError : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.description) return;

    submitting.current = true;
    try {
      await mutation.mutateAsync({ title: trimmed, description });
    } catch {
      // The mutation exposes the error for rendering and keeps the entered values.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="create-heading">
      <h2 id="create-heading">פנייה חדשה</h2>
      <form className={styles.createForm} noValidate onSubmit={submit}>
        <label htmlFor="ticket-title">כותרת</label>
        <input id="ticket-title" required value={title} disabled={mutation.isPending}
          aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined}
          onChange={(event) => { setTitle(event.target.value); setErrors({ ...errors, title: undefined }); }} />
        {errors.title && <p id="title-error" className={styles.error} role="alert">{errors.title}</p>}
        <label htmlFor="ticket-description">תיאור (אופציונלי)</label>
        <textarea id="ticket-description" rows={4} value={description} disabled={mutation.isPending}
          aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined}
          onChange={(event) => { setDescription(event.target.value); setErrors({ ...errors, description: undefined }); }} />
        {errors.description && <p id="description-error" className={styles.error} role="alert">{errors.description}</p>}
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'שומר פנייה…' : 'צור פנייה'}
        </button>
        {mutation.isError && <p className={styles.error} role="alert">לא ניתן היה לאשר את יצירת הפנייה. אפשר לבדוק את הרשימה לפני ניסיון נוסף.</p>}
        {mutation.isSuccess && <p className={styles.success} role="status">הפנייה נשמרה.</p>}
      </form>
    </section>
  );
}
