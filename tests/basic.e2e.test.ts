import { buildApp } from "../src/app.js";
import { pool, query } from "../src/db/index.js";
import type { Response as InjectResponse } from "light-my-request";

describe("Booking E2E", () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
    await query("DELETE FROM bookings WHERE event_id=$1", [9999]);
    await query(`INSERT INTO events (id, name, total_seats) VALUES (9999, 'stresssed test', 50)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name, total_seats = EXCLUDED.total_seats`);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  test("race: 200 concurrent reserves, only 50 can reach success", async () => {
    const NumOfPres = 200;

    const reqs: Array<Promise<InjectResponse>> = Array.from(
      { length: NumOfPres },
      (_undef, index) => {
        return app.inject({
          method: "POST",
          url: "/api/bookings/reserve",
          headers: { "content-type": "application/json" },
          payload: { event_id: 9999, user_id: `u${index}` },
        });
      }
    );

    const resps = await Promise.all(reqs);
    const statusCounts = resps.reduce<Record<number, number>>((accum, r) => {
      accum[r.statusCode] = (accum[r.statusCode] || 0) + 1;
      return accum;
    }, {});

    if ((statusCounts[201] ?? 0) !== 50) {
      const sample = resps.find((r) => r.statusCode !== 201);
      // eslint-disable-next-line no-console
      console.error(
        "byStatus",
        statusCounts,
        "sampleNon201",
        sample?.statusCode,
        sample?.body
      );
    }

    expect(statusCounts[201] ?? 0).toBe(50);
    expect(((statusCounts[409] ?? 0) + (statusCounts[201] ?? 0))).toBe(NumOfPres);

  }, 70*1000);

  test('POST /api/bookings/reserve → 201 (happy path)', async () => {
    await query('DELETE FROM bookings WHERE event_id=$1', [11001]);
    await query(`
      INSERT INTO events (id, name, total_seats)
      VALUES (11001, 'Happy', 2)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, total_seats=EXCLUDED.total_seats
    `);

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 11001, user_id: 'alice' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toEqual(
      expect.objectContaining({
        booking_id: expect.any(Number),
        event_id: 11001,
        user_id: 'alice',
        created_at: expect.any(String),
      })
    );
  });

  test('duplicate user on same event → 409 already_booked', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 11001, user_id: 'alice' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: 'already_booked' });
  });

  test('sold_out when capacity exhausted → 409 sold_out', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 11001, user_id: 'bob' },
    });
    expect(ok.statusCode).toBe(201);

    const sold = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 11001, user_id: 'charlie' },
    });
    expect(sold.statusCode).toBe(409);
    expect(sold.json()).toEqual({ error: 'sold_out' });
  });

  test('idempotency: same Idempotency-Key returns cached 201 and identical body', async () => {
    await query('DELETE FROM bookings WHERE event_id=$1', [11002]);
    await query(`
      INSERT INTO events (id, name, total_seats)
      VALUES (11002, 'Idem', 1)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, total_seats=EXCLUDED.total_seats
    `);

    const key = 'idem-key-11002-A';
    const first = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json', 'idempotency-key': key },
      payload: { event_id: 11002, user_id: 'dan' },
    });
    expect(first.statusCode).toBe(201);
    const b1 = first.json();

    const second = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json', 'idempotency-key': key },
      payload: { event_id: 11002, user_id: 'dan' },
    });
    expect(second.statusCode).toBe(201);
    const b2 = second.json();

    expect(b2).toEqual(b1);

    const sold = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 11002, user_id: 'ed' },
    });
    expect(sold.statusCode).toBe(409);
    expect(sold.json()).toEqual({ error: 'sold_out' });
  });

  test('event_not_found → 404', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 987654321, user_id: 'ghost' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'event_not_found' });
  });

  test('validation: bad payload → 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings/reserve',
      headers: { 'content-type': 'application/json' },
      payload: { event_id: 'oops', user_id: '' } as any,
    });
    expect(res.statusCode).toBe(422);
    const body = res.json();
    expect(body).toHaveProperty('error', 'validation_error');
  });
});
