import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureTable() {
    try {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`);
    } catch (error: any){
        console.error('Failed to ensure schema_migrations:', error?.code, error?.message);
        throw error;
    }
}

async function migrate() {
    await ensureTable();
    const dir = join(__dirname, 'migrations');
    const files = readdirSync(dir).filter(filt => filt.endsWith('.sql')).sort();

    for (const file of files){
        const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [file]);
        if(exists.rowCount)
            continue;

        const sql = readFileSync(join(dir, file), 'utf-8');
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log('Applied', file);       
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Failed', file, error);
            process.exit(1);
        } finally{
            client.release();
        }
    }
    await pool.end();
}

migrate();