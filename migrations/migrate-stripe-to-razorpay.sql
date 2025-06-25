-- Migration script to change column names from Stripe to Razorpay

-- Rename stripe_customer_id to razorpay_customer_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_customer_id TO razorpay_customer_id;

-- Rename stripe_subscription_id to razorpay_subscription_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;

-- Rename stripe_price_id to razorpay_plan_id
ALTER TABLE user_subscriptions RENAME COLUMN stripe_price_id TO razorpay_plan_id;

-- Rename stripe_current_period_ended_at to razorpay_current_period_ended_at
ALTER TABLE user_subscriptions RENAME COLUMN stripe_current_period_ended_at TO razorpay_current_period_ended_at;
