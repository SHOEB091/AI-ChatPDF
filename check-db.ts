import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './src/lib/db/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabase() {
  try {
    console.log("🔍 Starting database check...");
    
    // Verify connection string exists
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not defined");
      return;
    }
    
    // Initialize database connection
    console.log("🔌 Connecting to database...");
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Check table structure
    console.log("📋 Checking table structure...");
    
    try {
      const result = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions'
      `;
      
      console.log("📊 Table columns in user_subscriptions:");
      result.forEach((column: any) => {
        console.log(`   - ${column.column_name} (${column.data_type})`);
      });
      
      // Check for specific columns
      const columnNames = result.map((col: any) => col.column_name);
      
      // Check if we have Stripe or Razorpay columns
      const hasStripeColumns = 
        columnNames.includes('stripe_customer_id') || 
        columnNames.includes('stripe_subscription_id');
        
      const hasRazorpayColumns = 
        columnNames.includes('razorpay_customer_id') || 
        columnNames.includes('razorpay_subscription_id');
      
      if (hasStripeColumns) {
        console.log("⚠️ Database still has Stripe columns. Migration needed!");
        console.log("   Run: npm run migrate");
      } else if (hasRazorpayColumns) {
        console.log("✅ Database has Razorpay columns. Schema is up to date!");
      } else {
        console.log("❓ Couldn't determine subscription column types.");
      }
      
    } catch (error) {
      console.error("❌ Error checking table structure:", error);
    }
    
  } catch (error) {
    console.error("❌ Database connection error:", error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
