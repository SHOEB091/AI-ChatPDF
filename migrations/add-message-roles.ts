import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  try {
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);

    console.log('Running migrations...');
    
    // Drop existing table and enum
    await sql`DROP TABLE IF EXISTS messages CASCADE`;
    await sql`DROP TYPE IF EXISTS user_system_enum CASCADE`;
    
    // Create new enum and table
    await sql`CREATE TYPE message_role_enum AS ENUM ('system', 'user', 'assistant')`;
    await sql`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        role message_role_enum NOT NULL
      )
    `;

    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

runMigration();
