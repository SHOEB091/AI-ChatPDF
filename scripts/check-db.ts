import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Initialize the database connection
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Query to check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const tables = await sql.query(tablesQuery);
    console.log('\nExisting tables:');
    tables.forEach((table: any) => {
      console.log(`- ${table.table_name}`);
    });
    
    // Query to check enum types
    const enumQuery = `
      SELECT t.typname AS enum_name,
             e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder;
    `;

    const enums = await sql.query(enumQuery);
    console.log('\nEnum types:');
    const enumTypes: { [key: string]: string[] } = {};
    enums.forEach((e: any) => {
      if (!enumTypes[e.enum_name]) {
        enumTypes[e.enum_name] = [];
      }
      enumTypes[e.enum_name].push(e.enum_value);
    });
    
    for (const [name, values] of Object.entries(enumTypes)) {
      console.log(`- ${name}: ${values.join(', ')}`);
    }

  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
