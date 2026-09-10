import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ isPro: false }, { status: 200 });
    }

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!_userSubscriptions[0]) {
      return NextResponse.json({ isPro: false }, { status: 200 });
    }

    const userSubscription = _userSubscriptions[0];

    // For direct payments, we don't require razorpayPlanId
    // We just need a valid razorpayCurrentPeriodEnd
    const isValid =
      userSubscription.razorpayCurrentPeriodEnd &&
      userSubscription.razorpayCurrentPeriodEnd.getTime() + DAY_IN_MS >
        Date.now();

    console.log("Subscription check:", {
      userId,
      hasSubscription: !!userSubscription,
      periodEnd: userSubscription.razorpayCurrentPeriodEnd,
      isValid: !!isValid,
      currentTime: new Date(),
      expiryTime: userSubscription.razorpayCurrentPeriodEnd ?
        new Date(userSubscription.razorpayCurrentPeriodEnd.getTime() + DAY_IN_MS) : null
    });

    return NextResponse.json({ isPro: !!isValid }, { status: 200 });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Creating manual subscription for user:", userId);

    // Set subscription end date (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    console.log("Setting subscription period end to:", periodEnd);

    // Check if user already has subscription
    const existingSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (existingSubscription.length > 0) {
      console.log("User already has a subscription record. Updating it...");
      await db
        .update(userSubscriptions)
        .set({
          razorpayCurrentPeriodEnd: periodEnd,
        })
        .where(eq(userSubscriptions.userId, userId));

      return NextResponse.json({
        success: true,
        message: "Subscription updated successfully",
        userId,
        periodEnd
      });
    } else {
      console.log("Creating new subscription record");
      const subscriptionData = {
        userId: userId,
        razorpayCustomerId: null, // No customer ID for direct payment
        razorpaySubscriptionId: `manual_${Date.now()}`, // Manual subscription ID
        razorpayPlanId: null, // No plan ID for direct payment
        razorpayCurrentPeriodEnd: periodEnd,
      };

      console.log("Subscription data:", subscriptionData);

      await db.insert(userSubscriptions).values(subscriptionData);

      return NextResponse.json({
        success: true,
        message: "Subscription created successfully",
        userId,
        periodEnd
      });
    }

  } catch (error) {
    console.error("Error creating manual subscription:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
