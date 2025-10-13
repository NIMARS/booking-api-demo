import { pool } from "./index.js";

async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO events (name, total_seats) VALUES 
                ('Test Event 1', 5),
                ('Test Event 2', 100)
                ON CONFLICT DO NOTHING`);
        await client.query('COMMIT');
        console.log('Test Events 1, 2 Seeeeeded and nanced');
    
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
    } finally{
        client.release();
        await pool.end();
    }
}

seed();