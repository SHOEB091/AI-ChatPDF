// /api/razorpay

import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { PREMIUM_PLAN, RAZORPAY_KEY_ID, getOrCreatePlan, razorpay } from "@/lib/razorpay";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Base URL for redirecting after payment
const return_url = process.env.NEXT_BASE_URL + "/";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
      
    // Check if user already has subscription
    if (_userSubscriptions[0] && _userSubscriptions[0].razorpaySubscriptionId) {
      // User has existing subscription - generate subscription management link
      // Razorpay doesn't have a direct billing portal like Stripe,
      // so we'll create a new subscription management page instead
      return NextResponse.json({
        type: "manage",
        subscription_id: _userSubscriptions[0].razorpaySubscriptionId,
        key_id: RAZORPAY_KEY_ID,
        prefill: {
          email: user?.emailAddresses[0].emailAddress
        }
      });
    }

    // Create an order directly with user ID in notes
    const orderId = await getOrCreatePlan(userId);

    // Get order details
    const order = await razorpay.orders.fetch(orderId);
    
    if (!order) {
      throw new Error("Failed to fetch order details");
    }
    
    return NextResponse.json({
      type: "checkout",
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID,
      name: PREMIUM_PLAN.name,
      description: PREMIUM_PLAN.description,
      image: `${process.env.NEXT_BASE_URL}/favicon.ico`,
      callback_url: `${process.env.NEXT_BASE_URL}/api/webhook`,
      // Notes should already be in the order from getOrCreatePlan
      prefill: {
        email: user?.emailAddresses[0].emailAddress
      }
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new NextResponse("Error creating payment order", { status: 500 });
  }
}
