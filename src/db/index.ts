import { Pool, type PoolClient, type QueryResult } from 'pg';
import 'dotenv/config';

export const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    max: 10,
})

export async function query<T extends QueryResult = QueryResult>(text: string, params?: any[]):
Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
  }

export async function withT<T>(
    fn: (c: PoolClient ) => Promise<T>, maxRetries = 5
): Promise<T> {
    for (let attempt  = 1; attempt  <= maxRetries; attempt ++){
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); // SERIALIZABLE Uhm?
            const res = await fn(client);
            await client.query('COMMIT');
            return res;
        } catch (error: any) {
            await client.query('ROLLBACK').catch(() => {});
            const code = error?.code as string | undefined;
        if ((code === '40001' || code === '40P01') && attempt  < maxRetries)
                continue;
            throw error;
        }finally{
            client.release();
        }
    }
    throw new Error('unreachable');
    
}