import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable')
}

// Direct PostgreSQL connection pool
// This bypasses PostgREST and allows access to all schemas (public, inter_app, etc.)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set search_path to include inter_app schema
  options: '-c search_path=public,inter_app',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper function to execute queries with proper error handling
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

// Helper function to execute a single query and return one row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

// Helper function for transactions
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end()
})
