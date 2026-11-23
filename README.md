# Service Ticket Management

A Hebrew RTL service desk for searching, filtering, creating, and updating service tickets. React and Vite provide the interface, backed by an Express API and file-backed SQLite.

## Local setup

From the repository root, use Node.js 22 LTS (22.11 or later) or Node.js 24 LTS and npm. The SQLite driver uses a native binary. On platforms without a prebuilt binary, installation requires the platform's node-gyp build tools.

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open the Local URL printed by Vite, usually http://localhost:5173. The Vite proxy forwards API requests to the backend, which listens on port 3000 by default. Keep the same `PORT` environment value for both processes when overriding it. The database lives at `server/data/tickets.sqlite`. Set `PORT` or `DATABASE_PATH` in the process environment to override those defaults. Use an absolute path for `DATABASE_PATH` to share the same file across invocation directories.

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Generate a Drizzle Kit migration after a schema change |
| `npm run db:migrate` | Apply committed migrations |
| `npm run db:seed` | Insert 25 deterministic Hebrew sample tickets into an empty database |
| `npm run test:server` | Run API integration tests against disposable SQLite files |
| `npm run test:client` | Run client behavior tests with Vitest and React Testing Library |
| `npm test` | Run both workspace test suites |
| `npm run typecheck` | Check TypeScript in both workspaces |
| `npm run build` | Compile the backend and build the client into their dist directories |
| `npm start` | Run the compiled backend against the migrated database |

## API

| Method and path | Contract |
| --- | --- |
| `GET /api/tickets` | Optional `page`, `search`, and `status`. Returns `items`, `page`, `pageSize`, `total`, and `totalPages`. |
| `POST /api/tickets` | Accepts a trimmed 3–100 character `title` and an optional `description` of up to 2,000 characters. Returns the created ticket with HTTP 201. |
| `PATCH /api/tickets/:id/status` | Accepts `status` and returns the updated ticket. Unknown IDs return HTTP 404. |

Statuses are `open`, `in_progress`, and `closed`. Every transition is allowed. Tickets include `id`, `title`, `description`, `status`, and an ISO 8601 `created_at`. Validation failures return HTTP 400 with `code`, `message`, and applicable `fieldErrors`.

## Architecture and trade-offs

- Express 5 gives the three synchronous endpoints a small routing and middleware surface. Zod validates incoming values at the route boundary, and centralized middleware translates errors into JSON.
- The ticket feature keeps HTTP handling, business behavior, and database queries in separate small modules. Drizzle supplies typed, parameterized queries and versioned migrations.
- File-backed SQLite keeps setup local. The list uses a read transaction so the count and page share a snapshot. Literal title substring search supports Hebrew but scans titles, which suits this dataset. Offset pagination orders by creation time and ID descending, with ten tickets per page.
- SQLite assigns all ticket IDs. On a fresh database, the seed creates IDs 1–25 and the next ticket receives ID 26. The seed skips databases that already contain tickets, preserving existing rows and edits. The server uses millisecond timestamps and the database supplies the initial status.
- Vitest and Supertest exercise the real Express handlers and committed migrations against isolated file-backed databases. The development database stays available for manual verification.

## Frontend

TanStack Query keys the ticket list by applied search, status, and page. React state keeps draft filters and form entries local. Mutations refresh server data after confirmation. CSS Modules scope layout and component styles, and native controls support keyboard interaction and RTL direction.

For a local production-build preview, run the backend with `npm start` and the frontend with `npm exec -w client -- vite preview`. A deployed client expects the API to be available under `/api` on the same origin.

## Submission

Include the root package manifest and lockfile, both workspaces, the Drizzle SQL and migration metadata, the assignment PDF, and this README. A fresh checkout recreates the local database with the migration and seed commands above. Exclude local database files, dependency directories, build output, and backup archives.

SQLite and offset pagination suit a small local assignment. Concurrent changes can shift records between pages, and a response lost after a successful POST can require a list check before retrying. The dev server and Vite preview are intended for local review. A hosted deployment needs a server that serves the built client and routes `/api` to Express.

The dependency audit still reports moderate development-only findings in the Drizzle Kit toolchain. Production dependencies passed the audit at final verification.
