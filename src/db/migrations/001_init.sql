CREATE TABLE
    IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        total_seats INT NOT NULL CHECK (total_seats >= 0)
    );

CREATE TABLE
    IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        UNIQUE (event_id, user_id)
    );

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings (event_id);