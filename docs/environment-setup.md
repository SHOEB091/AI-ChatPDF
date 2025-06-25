# Environment Setup Guide

## Consolidated Environment Files

We've consolidated all environment variables into a single `.env` file for better management. 

### What Changed?
- Combined all environment variables from `.env`, `.env.local`, and `.env.example` into a single `.env` file
- Removed `.env.local` which contained only Razorpay keys
- Created a comprehensive `.env.example` template for new installations
- Added setup instructions to the README

## Environment Files

1. **`.env`** - Contains all your actual configuration values (keep private, do not commit)
2. **`.env.example`** - Template showing required variables without actual values (safe to commit)

## How to Configure the Application

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in the `.env` file with actual values for:
   - Clerk authentication
   - Database credentials
   - AWS S3 storage
   - Pinecone vector database 
   - OpenAI API
   - Razorpay payment gateway

## Key Environment Variables

### Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Database
- `DATABASE_URL`

### Storage
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`
- `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`

### Vector Database
- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`
- `PINECONE_INDEX_NAME`

### AI
- `OPENAI_API_KEY`

### Payments
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Important Notes

- Never commit your `.env` file containing actual keys to version control
- Always keep your private keys secure
- For production, consider using environment variable services provided by your hosting platform
