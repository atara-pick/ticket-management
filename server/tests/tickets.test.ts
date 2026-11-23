import { seedTickets } from '../src/db/seed.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { migrationsPath } from '../src/config/env.js';
import { openDatabase } from '../src/db/client.js';
import { tickets } from '../src/db/schema.js';

const endpoint = '/api/tickets';
let directory: string;
let path: string;
let database: ReturnType<typeof openDatabase>;
let api: ReturnType<typeof request>;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'ticket-api-'));
  path = join(directory, 'test.sqlite');
  database = openDatabase(path);
  migrate(database.db, { migrationsFolder: migrationsPath });
  api = request(createApp(database.db));
});

afterEach(() => {
  database.close();
  rmSync(directory, { recursive: true, force: true });
});

async function create(title = 'חשבונית חסרה') {
  return (await api.post(endpoint).send({ title }).expect(201)).body;
}

describe('ticket creation', () => {
  it('trims the title, preserves description and generates ID, date and initial status', async () => {
    const before = Date.now();
    const { body } = await api.post(endpoint).send({
      title: '  חשבונית חסרה  ', description: ' פירוט ',
    }).expect(201);
    expect(body).toMatchObject({ id: 1, title: 'חשבונית חסרה', description: ' פירוט ', status: 'open' });
    const timestamp = new Date(body.created_at);
    expect(timestamp.toISOString()).toBe(body.created_at);
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it.each([{}, { title: '  ab ' }, { title: 'a'.repeat(101) }, { title: 123 }])(
    'rejects invalid title %j without inserting', async (input) => {
      const { body } = await api.post(endpoint).send(input).expect(400);
      expect(body.fieldErrors.title).toBeTruthy();
      expect((await api.get(endpoint)).body.total).toBe(0);
    },
  );

  it('accepts omitted and explicitly empty descriptions', async () => {
    expect((await create()).description).toBe('');
    const { body } = await api.post(endpoint).send({ title: 'Empty description', description: '' }).expect(201);
    expect(body.description).toBe('');
  });

  it('rejects oversize descriptions and client-controlled fields', async () => {
    const { body } = await api.post(endpoint).send({
      title: 'Valid title', description: 'a'.repeat(2001), id: 12, status: 'closed', created_at: '2025-01-01',
    }).expect(400);
    expect(Object.keys(body.fieldErrors).sort()).toEqual(['created_at', 'description', 'id', 'status']);
    expect((await api.get(endpoint)).body.total).toBe(0);
  });
});

describe('ticket listing', () => {
  it('matches literal partial Hebrew titles, combines filters and excludes description matches', async () => {
    const first = await create('חשבונית חסרה');
    const second = await create('חשבונית כפולה');
    await api.patch(`${endpoint}/${second.id}/status`).send({ status: 'closed' }).expect(200);
    await api.post(endpoint).send({ title: 'תקלה במשלוח', description: 'חשבונית' }).expect(201);
    const search = 'שבוני';
    const unfiltered = await api.get(endpoint).query({ search }).expect(200);
    expect(unfiltered.body.total).toBe(2);
    const filtered = await api.get(endpoint).query({ search, status: 'open' }).expect(200);
    expect(filtered.body).toMatchObject({ items: [first], total: 1, totalPages: 1 });
    expect((await api.get(endpoint).query({ search: '%' })).body.total).toBe(0);
    expect((await api.get(endpoint).query({ search: ' ' })).body.total).toBe(3);
  });

  it('sorts by date then descending ID, paginates 10 at a time and returns empty out-of-range pages', async () => {
    const date = new Date('2025-01-01T00:00:00.000Z');
    database.db.insert(tickets).values([
      { title: 'Newest fixture', created_at: new Date(date.getTime() + 1) },
      ...Array.from({ length: 12 }, (_, index) => ({ title: `Fixture ${index}`, created_at: date })),
    ]).run();
    const first = (await api.get(endpoint).expect(200)).body;
    expect(first).toMatchObject({ page: 1, pageSize: 10, total: 13, totalPages: 2 });
    expect(first.items.map((item: { id: number }) => item.id)).toEqual([1, 13, 12, 11, 10, 9, 8, 7, 6, 5]);
    expect((await api.get(endpoint).query({ page: 2 }).expect(200)).body.items
      .map((item: { id: number }) => item.id)).toEqual([4, 3, 2]);
    expect((await api.get(endpoint).query({ page: 3 }).expect(200)).body)
      .toEqual({ items: [], page: 3, pageSize: 10, total: 13, totalPages: 2 });
    const newest = await create();
    expect((await api.get(endpoint)).body.items[0]).toEqual(newest);
  });

  it.each(['0', '-1', '1.5', '', '2e1', '9007199254740992', ['1', '2']])(
    'rejects invalid page %j', async (page) => {
      const { body } = await api.get(endpoint).query({ page }).expect(400);
      expect(body.fieldErrors.page).toBeTruthy();
    },
  );
});

describe('status updates and persistence', () => {
  it('updates status immediately and persists across a database reopen', async () => {
    const ticket = await create();
    for (const status of ['in_progress', 'closed', 'open', 'closed']) {
      const { body } = await api.patch(`${endpoint}/${ticket.id}/status`).send({ status }).expect(200);
      expect(body).toEqual({ ...ticket, status });
    }
    database.close();
    database = openDatabase(path, true);
    api = request(createApp(database.db));
    expect((await api.get(endpoint).expect(200)).body.items).toEqual([{ ...ticket, status: 'closed' }]);
  });

  it('rejects invalid status at the API and database boundaries', async () => {
    const ticket = await create();
    const { body } = await api.patch(`${endpoint}/${ticket.id}/status`).send({ status: 'done' }).expect(400);
    expect(body.fieldErrors.status).toBeTruthy();
    expect(() => database.db.run("UPDATE tickets SET status = 'done'")).toThrow(expect.objectContaining({ cause: expect.objectContaining({ code: 'SQLITE_CONSTRAINT_CHECK' }) }));
    expect((await api.get(endpoint)).body.items).toEqual([ticket]);
  });

  it('returns 400 for an invalid ID and 404 for a missing ticket', async () => {
    await api.patch(`${endpoint}/0/status`).send({ status: 'closed' }).expect(400);
    await api.patch(`${endpoint}/999/status`).send({ status: 'closed' }).expect(404);
  });

  it('returns a structured error for malformed JSON', async () => {
    const { body } = await api.post(endpoint).type('json').send('{').expect(400);
    expect(body.code).toBe('INVALID_BODY');
  });
});

it('seeds IDs 1–25, generates ID 26 through the API and preserves every row on rerun', async () => {
  expect(seedTickets(database.db)).toEqual({ inserted: 25, total: 25 });
  const seeded = database.db.select().from(tickets).orderBy(tickets.id).all();
  expect(seeded.map(({ id }) => id)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
  expect(new Set(seeded.map(({ status }) => status))).toEqual(new Set(['open', 'in_progress', 'closed']));
  for (let index = 1; index < seeded.length; index++) {
    expect(seeded[index].created_at.getTime()).toBeGreaterThan(seeded[index - 1].created_at.getTime());
  }
  const firstPage = await api.get(endpoint).expect(200);
  expect(firstPage.body.items.map((ticket: { id: number }) => ticket.id))
    .toEqual([25, 24, 23, 22, 21, 20, 19, 18, 17, 16]);

  const userTicket = await create('Existing user ticket');
  expect(userTicket.id).toBe(26);
  await api.patch(`${endpoint}/1/status`).send({ status: 'closed' }).expect(200);
  const before = database.db.select().from(tickets).orderBy(tickets.id).all();

  expect(seedTickets(database.db)).toEqual({ inserted: 0, total: 25 });
  expect(database.db.select().from(tickets).orderBy(tickets.id).all()).toEqual(before);

  database.close();
  database = openDatabase(path, true);
  api = request(createApp(database.db));
  const { body } = await api.get(endpoint).expect(200);
  expect(body.total).toBe(26);
  expect(body.items[0]).toEqual(userTicket);
  expect(database.db.select().from(tickets).orderBy(tickets.id).all()).toEqual(before);
});

it('leaves an already populated unseeded database alone', async () => {
  const userTicket = await create('Existing user ticket');
  expect(seedTickets(database.db)).toEqual({ inserted: 0, total: 25 });
  expect((await api.get(endpoint).expect(200)).body.items).toEqual([userTicket]);
});

it('returns a structured 400 for a malformed encoded ticket ID', async () => {
  const { body } = await api.patch(endpoint + '/%FF/status').send({ status: 'closed' }).expect(400);
  expect(body.code).toBe('INVALID_PATH');
});
