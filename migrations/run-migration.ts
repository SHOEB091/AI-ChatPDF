import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Read the migration SQL
const migrationSql = fs.readFileSync(
  path.join(__dirname, 'migrate-stripe-to-razorpay.sql'), 
  'utf-8'
);

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Execute the migration
async function runMigration() {
  try {
    console.log('Starting migration from Stripe to Razorpay...');
    
    // Split and execute each SQL command separately
    const sqlCommands = migrationSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    for (const command of sqlCommands) {
      console.log(`Executing: ${command}`);
      await sql.query(command);
    }
    
    console.log('Column renaming completed successfully.');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
