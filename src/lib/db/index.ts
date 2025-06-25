import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

function getDb() {
  if (!dbInstance) {
    const sql = neon(process.env.DATABASE_URL!);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// Export database instance
export const db = getDb();

// Test the connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Initialize connection on startup
testConnection()
  .then((isConnected) => {
    if (isConnected) {
      console.log('Database connection initialized successfully');
    } else {
      console.error('Failed to initialize database connection');
    }
  })
  .catch((error) => {
    console.error('Error testing database connection:', error);
  });
