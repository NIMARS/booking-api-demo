import type { PoolClient } from 'pg';

const LOCK_NS = 8844221;

export type HttpStatus =
  400 | 401 | 403 | 404 | 409 | 410 | 422 | 429 | 500 | 503;

export class AppError extends Error {
    status: HttpStatus;
    code?: string;
    constructor(message: string, status: HttpStatus = 400, code?: string) {
        super(message);
        this.status = status;
        this.code = (code === undefined ? 'undefined' : code); 
    }
}

export async function reserveSeat(client: PoolClient, eventId: number, userId: string, ) {

    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [LOCK_NS, eventId]);

    const event = await client.query<{id: number; total_seats: number}> (
        'SELECT id, total_seats FROM events WHERE id=$1 FOR UPDATE', [eventId]
    );

    const eventRow = event.rows[0];
    if(!eventRow)
        throw new AppError('event_not_found', 404);

    const dedup = await client.query('SELECT 1 FROM bookings WHERE event_id=$1 AND user_id=$2 LIMIT 1', [eventId, userId]);
    if (dedup.rows.length > 0) throw new AppError('already_booked', 409);

    const insertion = await client.query<{ id: number; created_at: string }>(
        `WITH caps AS (SELECT total_seats FROM events WHERE id = $1),
        used AS (SELECT COUNT(*)::int AS cnt FROM bookings WHERE event_id = $1)
        INSERT INTO bookings (event_id, user_id)
        SELECT $1, $2
        WHERE (SELECT cnt FROM used) < (SELECT total_seats FROM caps)
        RETURNING id, created_at`,
        [eventId, userId]
      );
    
    const row = insertion.rows[0];
    if (!row)
        throw new AppError('sold_out', 409);
      
    return {booking_id: row.id, event_id: eventId, user_id: userId, created_at: row.created_at };
}