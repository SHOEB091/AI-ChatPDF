# ChatPDF Testing Guide

This document provides step-by-step instructions for testing all aspects of the ChatPDF application, including file uploads, chat functionality, Razorpay payments, and database operations.

## Prerequisites

Before you begin testing:

1. Make sure all environment variables are correctly set in your `.env` file
2. Run the database migration if you're switching from Stripe to Razorpay:
   ```bash
   npm run migrate
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing Flow

### 1. User Authentication

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Sign up for a new account** using Clerk authentication
3. **Verify** you can log in and out successfully

### 2. PDF Upload

1. **Navigate** to the home page
2. **Click** the upload button
3. **Select** a PDF file from your system
4. **Verify** the PDF is uploaded successfully and appears in your list
5. **Check the console logs** to ensure no errors during upload
6. **Verify in AWS S3** that the file was uploaded correctly (use AWS Console)

### 3. Chat Functionality

1. **Click** on one of your uploaded PDFs
2. **Wait** for the PDF to be processed (embeddings created)
3. **Ask a question** about the content of the PDF
4. **Verify** the AI responds with relevant information from the PDF
5. **Try multiple questions** to test comprehension and context retention
6. **Check the database** to ensure chat messages are being saved

### 4. Subscription/Payment Testing

#### Razorpay Test Mode

1. **Click** on the subscription/upgrade button
2. **Verify** the Razorpay checkout modal opens correctly
3. **Use Razorpay test credentials**:
   - Card Number: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date
   - OTP: 1234
4. **Complete** the payment process
5. **Verify** the subscription status updates correctly in the UI
6. **Check the database** to ensure subscription details are saved

#### Testing Webhooks Locally

For webhook testing, you'll need a tool like ngrok to expose your local server:

1. **Install ngrok**: `npm install -g ngrok`
2. **Expose your local server**: `ngrok http 3000`
3. **Update your Razorpay webhook URL** in the Razorpay dashboard to the ngrok URL
4. **Make test payments** and monitor the webhook responses

### 5. Database Testing

You can connect to your Neon database to verify data is being stored correctly:

1. **Use a PostgreSQL client** like pgAdmin, DBeaver, or TablePlus
2. **Connect** using your DATABASE_URL
3. **Verify** these tables have correct data:
   - `chats` - Check for uploaded PDFs
   - `messages` - Verify chat messages are saved
   - `user_subscriptions` - Check subscription details

### 6. Vector Database Testing

To verify your Pinecone vector database is working:

1. **Upload a new PDF** and wait for processing
2. **Log in to Pinecone dashboard**
3. **Check** your index has new vectors with correct metadata
4. **Make a query** through the chat and verify vector search works

## Troubleshooting Common Issues

### File Upload Issues
- Check S3 bucket permissions
- Verify AWS credentials in .env
- Look for CORS errors in browser console

### Chat Functionality Issues
- Check OpenAI API key is valid
- Verify Pinecone embeddings were created
- Look for rate limiting errors

### Payment Issues
- Verify Razorpay test mode is active
- Check webhook endpoint is accessible
- Confirm database columns match schema

## Logging and Monitoring

- **Check server logs** in the terminal running `npm run dev`
- **Monitor browser console** for frontend errors
- **Review database logs** for query errors

## End-to-End Testing Example

1. Register a new user
2. Upload a PDF document
3. Chat with the PDF content
4. Subscribe to the premium plan
5. Upload multiple PDFs (testing premium features)
6. Verify all data is correctly stored in the database
