# Razorpay Integration Guide

This guide explains how to set up and use Razorpay payment gateway in your ChatPDF application.

## Prerequisites

- Razorpay account (create one at [razorpay.com](https://razorpay.com))
- API Keys (Key ID and Secret Key) from your Razorpay Dashboard

## Environment Variables

Add these variables to your `.env.local` file:

```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_BASE_URL=http://localhost:3000
```

## Setting Up Webhooks

1. Log into your Razorpay Dashboard
2. Go to Settings > API Keys > Webhooks
3. Add a new webhook
4. Enter your webhook URL: `https://your-domain.com/api/webhook`
5. Select events to listen for:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`

## Testing Payments

Use these test card details for testing:

- Card number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 1234

## Database Schema

The user subscription data is stored in the `userSubscriptions` table with these Razorpay-specific fields:

- `razorpayCustomerId`: Customer ID from Razorpay
- `razorpaySubscriptionId`: Subscription ID from Razorpay
- `razorpayPlanId`: Plan ID from Razorpay
- `razorpayCurrentPeriodEnd`: Timestamp when the current subscription period ends

## Troubleshooting

If webhooks aren't working:
1. Make sure your webhook URL is publicly accessible
2. Check webhook signature verification in your webhook handler
3. Verify that the event types are correctly configured in the Razorpay dashboard

For payment failures:
1. Check if the Razorpay API keys are correctly set up
2. Ensure the currency is set to INR
3. Make sure the amount is in paise (multiply by 100)
