# Final delivery verification

All functional requirements in the four-page Hebrew assignment PDF are implemented. The checklist identifies the verification used for each requirement, including checks that ran against a real browser and database.

| PDF | Requirement | Result and evidence |
| --- | --- | --- |
| 1 | One service-ticket screen with search and filters, a list, creation, and pagination | Pass. Reviewed the live RTL screen and both responsive layouts. The interface uses React, CSS Modules, and native controls. |
| 1 | Scope limited to listing, creating, and changing ticket status | Pass. Reviewed the Express routes and visible UI. There are three business endpoints and no additional ticket management features. |
| 1 | Each row shows ID, title, description, creation date, and status selector. Empty descriptions display a dash. | Pass. Browser checked columns, timestamp markup, and the dash. The interface formats dates with the Hebrew locale. |
| 1 | Pagination shows the current page, previous and next controls, and at most 10 tickets. Boundary controls are disabled. | Pass. Browser checked the first and last boundaries and page size. API tests cover pagination metadata and out-of-range pages. |
| 2 | Initial load is unfiltered and newest first, breaking equal timestamps by descending ID | Pass. The browser matched the initial ten API IDs in order during the delivery review. The seed regression test now also checks auto-generated IDs 1–25 and API creation at ID 26. API integration tests exercise equal timestamps. |
| 2 | Create a ticket with a required title, optional description, server-generated identity and time, and initial open status | Pass. Browser created a ticket and confirmed persisted title, description, and status. API tests assert generated ID and ISO timestamp. |
| 2 | Trim titles and enforce 3–100 characters. Enforce the 2,000-character description limit. Validate in both layers and show inline errors. | Pass. Browser checked invalid input without a POST. Client and API tests cover length checks, optional and empty descriptions, and structured errors. |
| 2 | Successful creation clears both form fields, both filters, and pagination, then displays the new ticket first | Pass. Browser created from a filtered page 2 with unapplied edits and verified cleared fields, unfiltered page 1, and the confirmed ticket at the top. |
| 2 | Change status immediately. Allow each transition, disable the pending selector, refresh active filters, and show an error on failure with the confirmed value restored. | Pass. Browser changed statuses via the native selector against Express. Frontend tests cover failed updates and the pending selector. API review and tests verify that updates assign the requested allowed status without transition restrictions. |
| 2 | Updated tickets leave a filter they no longer match. An emptied page returns to the previous available page. | Pass. Browser moved open tickets to closed, verified their removal, and observed fallback from page 2 to page 1. |
| 3 | Search by partial Hebrew title on click or Enter, with the chosen status filter. Empty search and all-status selection do not restrict results. | Pass. Browser exercised both submission paths, combined Hebrew search with open status, and cleared both filters. API tests check title-only matching and empty search. |
| 3 | New searches start on page 1. Paging preserves the last applied filters, and delayed responses cannot replace a newer search. | Pass. Browser paged with unapplied edits. Frontend tests check search reset, query cancellation, and delayed responses. |
| 3 | Show loading, empty results, list errors, and retry using the same request. Keep creation available when results are empty. | Pass. Frontend tests cover loading and empty states. Browser injected a list failure, changed the draft, and verified retry requested the same applied URL. |
| 3 | Disable create while saving, prevent duplicate submissions, and preserve input on failure without displaying an unconfirmed ticket. | Pass. Browser held the POST and issued two submits. Exactly one request went out. Frontend tests cover preserved input on failure and the confirmed-success state. |
| 4 | Use Node.js, a supported frontend, and a persistent database with the specified fields and allowed statuses. | Pass. Browser used React → Vite proxy → Express → SQLite. The restarted compiled server returned the same ticket with its updated status. The migration enforces valid statuses. |
| 4 | Provide 25 example tickets with varied statuses and dates and a runnable submission | Pass. Clean install and migration succeeded. Seed runs inserted 25 and then zero. Integration tests verify reruns preserve both user-created and edited sample records. |

## Additional quality checks

- Desktop and mobile screenshots were inspected at 1366 and 390 CSS pixels. Edge also checked layout at 768 and 320 pixels with no document-level horizontal overflow. The table can scroll within its panel at narrow widths.
- Keyboard focus is visible, Enter submits search, and paging moves focus to the list heading. Forms have associated labels, validation messages, and status announcements. A dedicated screen-reader or cross-browser matrix was outside this verification.
- The API uses parameterized database queries, input validation, structured errors, and generic client-facing responses for unexpected failures. Production dependencies reported zero audit findings. The complete audit reported four moderate findings in the Drizzle Kit development chain. The suggested breaking downgrade was left unapplied.
- Git ignore checks covered dependency folders, build output, database files and sidecars, coverage, and TypeScript metadata. The migration remains eligible for tracking. The supplied workspace had no Git metadata, so ignore checks ran in a disposable repository.

## Executed commands

The following commands ran in a disposable source copy through the installed npm CLI.

| Command | Result |
| --- | --- |
| `npm ci` | Passed from the lockfile |
| `npm run db:migrate` | Applied the migration to an empty database |
| `npm run db:seed` | First run inserted 25 tickets. Second run inserted zero. |
| `npm test` | 22 backend and 11 frontend tests passed. Zero failures. |
| `npm run typecheck` | Both workspaces passed |
| `npm run build` | Backend compilation and Vite production build passed |
| `npm run dev` | Both development processes started. Headless Edge exercised the real app. |
| `node server/dist/server.js` | Compiled backend recovered the created ticket and its changed status after restart |
| `git init -q` | Created the disposable repository for ignore checks |
| `git check-ignore -- client/node_modules/x node_modules/x client/dist/index.html server/data/tickets.sqlite local.db-wal coverage/report client/build.tsbuildinfo` | All seven paths ignored |
| `git check-ignore -- server/drizzle/0000_absurd_warbound.sql` | Exit 1 as expected. The migration is eligible for tracking. |
| `npm.cmd audit --omit=dev` | Exit 0. Zero findings. |
| `npm.cmd audit` | Exit 1 for the four known development findings |

The browser run used `node .phase3-check.mjs`, a temporary Windows harness. The final run passed after isolating the Vite endpoint and waiting for the filtered page to finish refreshing. An earlier attempt reached an existing local Vite process and inserted one QA fixture. The exact fixture was removed, and the local database again contains 25 tickets. The harness and screenshots were removed after review.

See [README.md](README.md) for setup, verification scripts, and what to include in the submission.

