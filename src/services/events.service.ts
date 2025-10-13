import { type PoolClient } from 'pg';

export async function getEventAvailiability(client: PoolClient, eventId: number) {
    const event = await client.query<{id: number; name: string; total_seats: number }>
    ('SELECT id, name, total_seats FROM events WHERE id = $1', [eventId]);
 
    const eventRows = event.rows[0];
    if (!eventRows)
        return null;
    
    const booked = await client.query<{used: number}>
    ('SELECT COUNT (*)::int AS count FROM bookings WHERE event_id = $1', [eventId]);

    const used = booked.rows[0]?.used ?? 0;
    return {event_id: eventRows.id, total_seats: eventRows.total_seats, booked: used, left: Math.max(0, eventRows.total_seats - used)};

}