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

    const isValid =
      userSubscription.stripePriceId &&
      userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS >
        Date.now();

    return NextResponse.json({ isPro: !!isValid }, { status: 200 });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
}
