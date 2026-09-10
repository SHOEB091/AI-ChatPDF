import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { razorpay, validateWebhookSignature } from "@/lib/razorpay";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Get the raw body text and also parse as JSON
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log("=== WEBHOOK RECEIVED ===");
    console.log("Event:", body.event);
    console.log("Full payload:", JSON.stringify(body, null, 2));

    // Get request headers
    const headersList = headers();
    const razorpay_signature = (await headersList).get('x-razorpay-signature') || '';

    if (!razorpay_signature) {
      console.log("❌ Missing signature");
      return new NextResponse("Missing signature", { status: 400 });
    }

    // Verify webhook signature using the validation function
    if (!validateWebhookSignature(razorpay_signature, rawBody)) {
      console.log("❌ Invalid signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    console.log("✅ Webhook signature validated");
    const { payload } = body;
    
    // Handle subscription events
    if (body.event === "subscription.activated" || body.event === "subscription.charged") {
      const subscription = payload.subscription.entity;
      const userId = subscription.notes.userId;

      if (!userId) {
        return new NextResponse("No userId found", { status: 400 });
      }

      // Check if user already has subscription
      const existingSubscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (existingSubscription.length === 0) {
        // Create new subscription
        await db.insert(userSubscriptions).values({
          userId: userId,
          razorpayCustomerId: payload.customer.entity.id,
          razorpaySubscriptionId: subscription.id,
          razorpayPlanId: subscription.plan_id,
          razorpayCurrentPeriodEnd: new Date(subscription.current_end * 1000),
        });
      }
      else {
        // Update existing subscription
        await db
          .update(userSubscriptions)
          .set({
            razorpayPlanId: subscription.plan_id,
            razorpayCurrentPeriodEnd: new Date(subscription.current_end * 1000),
          })
          .where(eq(userSubscriptions.razorpaySubscriptionId, subscription.id));
      }
    }
    
    // Handle payment events for direct orders
    else if (body.event === "payment.captured" || body.event === "payment.authorized") {
      console.log("🔄 Processing payment event:", body.event);
      const payment = payload.payment.entity;
      console.log("Payment details:", {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status
      });

      // Get the userId from order notes
      let userId;

      try {
        // Fetch the order using the order_id from the payment
        console.log("📋 Fetching order details for:", payment.order_id);
        const order = await razorpay.orders.fetch(payment.order_id);
        console.log("Order details:", {
          id: order.id,
          notes: order.notes
        });

        if (order && order.notes) {
          userId = order.notes.userId;
          console.log("✅ Found userId in order notes:", userId);
        }

        if (!userId && payment.notes && payment.notes.userId) {
          userId = payment.notes.userId;
          console.log("✅ Found userId in payment notes:", userId);
        }
      } catch (err) {
        console.error("❌ Failed to fetch order details:", err);
        if (payment.notes && payment.notes.userId) {
          userId = payment.notes.userId;
          console.log("✅ Found userId in payment notes (fallback):", userId);
        }
      }

      if (!userId) {
        console.log("❌ No userId found in payment or order notes");
        console.log("Payment notes:", payment.notes);
        return new NextResponse("No userId found", { status: 400 });
      }
      
      // Set subscription end date (30 days from now)
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      console.log("📅 Setting subscription period end to:", periodEnd);

      // Check if user already has subscription
      console.log("🔍 Checking for existing subscription for userId:", userId);
      const existingSubscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      console.log("Existing subscriptions found:", existingSubscription.length);

      if (existingSubscription.length === 0) {
        // Create new subscription record
        console.log("➕ Creating new subscription record");
        const subscriptionData = {
          userId: userId,
          razorpayCustomerId: payment.customer_id || null,
          razorpaySubscriptionId: payment.id, // Use payment ID as subscription ID
          razorpayPlanId: null,
          razorpayCurrentPeriodEnd: periodEnd,
        };
        console.log("Subscription data:", subscriptionData);

        await db.insert(userSubscriptions).values(subscriptionData);
        console.log("✅ Successfully created subscription record");
      } else {
        // Update existing subscription
        console.log("🔄 Updating existing subscription");
        await db
          .update(userSubscriptions)
          .set({
            razorpayCurrentPeriodEnd: periodEnd,
          })
          .where(eq(userSubscriptions.userId, userId));
        console.log("✅ Successfully updated subscription record");
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
