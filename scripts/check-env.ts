#!/usr/bin/env node
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const requiredEnvVars = {
  'Gemini': ['GEMINI_API_KEY'],
  'Pinecone': [
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'PINECONE_INDEX_NAME'
  ],
  'AWS/S3': [
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_AWS_ACCESS_KEY_ID',
    'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY',
    'NEXT_PUBLIC_AWS_BUCKET_NAME'
  ],
  'Database': ['DATABASE_URL'],
  'Razorpay': [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ],
  'Base URL': ['NEXT_BASE_URL']
};

function checkEnvironmentVariables() {
  let hasErrors = false;
  console.log('🔍 Checking environment variables...\n');

  for (const [category, vars] of Object.entries(requiredEnvVars)) {
    console.log(`\n📋 Checking ${category} configuration...`);
    for (const envVar of vars) {
      if (!process.env[envVar]) {
        console.error(`❌ Missing ${envVar}`);
        hasErrors = true;
      } else {
        const value = process.env[envVar];
        const maskedValue = value.length > 8 
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '********';
        console.log(`✅ ${envVar} is set [${maskedValue}]`);
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Some required environment variables are missing. Please check your .env.local file.');
    process.exit(1);
  } else {
    console.log('\n✅ All required environment variables are set!');
  }
}

checkEnvironmentVariables();
