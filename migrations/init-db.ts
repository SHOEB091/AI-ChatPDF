import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

async function runMigration() {
  try {
    console.log('Starting initial database setup...');
    
    // Read the migration SQL
    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'init.sql'), 
      'utf-8'
    );

    // Initialize the database connection
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Execute the migration
    console.log('Executing migration...');
    const statements = migrationSql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().split('\n')[0] + '...');
        await sql.query(statement + ';');
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
