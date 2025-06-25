import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not defined in environment variables. Please add them to your .env file.");
}

// Define common Razorpay types
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, string>;
  created_at: number;
}

// Initialize Razorpay client
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Key ID for client-side use
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

// Premium subscription plan details
export const PREMIUM_PLAN = {
  name: "ChatPDF Pro",
  description: "Unlimited PDF sessions!",
  amount: 2000, // ₹20 in paise
  currency: "INR", 
  period: "monthly" as "monthly", // Type assertion to fix type error
  interval: 1
};

/**
 * Creates a subscription plan in Razorpay if it doesn't exist
 * @returns The plan ID
 */
export async function getOrCreatePlan(userId?: string) {
  try {
    console.log("Attempting to find or create Razorpay plan");
    
    // First, try to create a direct order without using plans
    const options = {
      amount: PREMIUM_PLAN.amount * 100, // Convert to paise (smallest unit)
      currency: PREMIUM_PLAN.currency,
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        plan_name: PREMIUM_PLAN.name,
        userId: userId || ''
      }
    };

    const order = await razorpay.orders.create(options);
    console.log("Created order successfully:", order.id);
    
    // Return the order ID - we'll use this instead of a plan ID
    return order.id;
    
    /* Commenting out the original plan logic as it seems to be causing issues
    // Attempt to find existing plans
    const plans = await razorpay.plans.all({});
    
    console.log("Found plans:", plans);
    
    const existingPlan = plans.items.find(
      (plan: any) => 
        plan.item.name === PREMIUM_PLAN.name && 
        plan.item.amount === PREMIUM_PLAN.amount
    );
    
    if (existingPlan) {
      console.log("Using existing plan:", existingPlan.id);
      return existingPlan.id;
    }
    
    // Create new plan if none exists
    const plan = await razorpay.plans.create({
      period: PREMIUM_PLAN.period,
      interval: PREMIUM_PLAN.interval,
      item: {
        name: PREMIUM_PLAN.name,
        description: PREMIUM_PLAN.description,
        amount: PREMIUM_PLAN.amount,
        currency: PREMIUM_PLAN.currency
      }
    });
    
    console.log("Created new plan:", plan?.id);
    return plan?.id || "";
    */
  } catch (error) {
    console.error("Error in getOrCreatePlan:", error);
    throw new Error("Failed to create or fetch Razorpay plan");
  }
}

/**
 * Validates a webhook signature from Razorpay
 * @param signature The signature from the x-razorpay-signature header
 * @param rawBody The raw body received from the webhook
 * @returns boolean indicating if the signature is valid
 */
export function validateWebhookSignature(signature: string, rawBody: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(rawBody)
      .digest('hex');
      
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}
