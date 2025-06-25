# Database Migration Guide: Stripe to Razorpay

This guide explains how to migrate your database schema from Stripe to Razorpay payment fields.

## The Problem

You've updated your codebase to use Razorpay instead of Stripe, but your database schema still has the old column names:

- `stripe_customer_id` (needs to become `razorpay_customer_id`)
- `stripe_subscription_id` (needs to become `razorpay_subscription_id`)
- `stripe_price_id` (needs to become `razorpay_plan_id`)
- `stripe_current_period_ended_at` (needs to become `razorpay_current_period_ended_at`)

## Migration Steps

1. **Backup Your Database** (Important!)
   
   Before running any migration, make a backup of your database.

2. **Run the Migration Script**

   ```bash
   npm run migrate
   ```

   This will rename the columns in your database to match the new Razorpay schema.

## What the Migration Does

The migration performs these SQL operations:

```sql
-- Rename stripe_customer_id to razorpay_customer_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_customer_id TO razorpay_customer_id;

-- Rename stripe_subscription_id to razorpay_subscription_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;

-- Rename stripe_price_id to razorpay_plan_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_price_id TO razorpay_plan_id;

-- Rename stripe_current_period_ended_at to razorpay_current_period_ended_at
ALTER TABLE user_subscriptions RENAME COLUMN stripe_current_period_ended_at TO razorpay_current_period_ended_at;
```

## Verification

After running the migration, you can verify it worked by:

1. Checking your database columns have been renamed
2. Testing the subscription API endpoint
3. Confirming existing subscriptions (if any) still work

## Troubleshooting

If you encounter errors:

- Check your database connection string
- Verify you have the right permissions to modify tables
- Make sure the columns exist before trying to rename them

For any issues, check the migration output logs or your database error logs.
