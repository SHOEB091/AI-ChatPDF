import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import ChatLayout from "@/components/ChatLayout";
import { db } from "@/lib/db";
import { chats, userSubscriptions } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

interface PageProps {
  params: {
    chatId: string;
  };
}

async function getChatData(chatId: string, userId: string) {
  try {
    // Get current chat
    const currentChat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, parseInt(chatId)))
      .limit(1);

    // Get all chats for the sidebar
    const allChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    return {
      currentChat: currentChat[0],
      allChats
    };
  } catch (error) {
    console.error("Error fetching chat data:", error);
    return null;
  }
}

async function checkSubscription(userId: string) {
  try {
    const DAY_IN_MS = 1000 * 60 * 60 * 24;

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!_userSubscriptions[0]) {
      return false;
    }

    const userSubscription = _userSubscriptions[0];

    // For direct payments, we don't require razorpayPlanId
    // We just need a valid razorpayCurrentPeriodEnd
    const isValid =
      userSubscription.razorpayCurrentPeriodEnd &&
      userSubscription.razorpayCurrentPeriodEnd.getTime() + DAY_IN_MS >
        Date.now();

    return !!isValid;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

export default async function ChatPage({ params }: PageProps) {
  const [{ userId }, resolvedParams] = await Promise.all([
    auth(),
    Promise.resolve(params)
  ]);

  if (!userId) {
    redirect("/sign-in");
  }

  const chatId = resolvedParams.chatId;
  if (!chatId || isNaN(parseInt(chatId))) {
    redirect("/");
  }

  try {
    const data = await getChatData(chatId, userId);
    if (!data?.currentChat) {
      redirect("/");
    }

    // Check actual subscription status
    const isPro = await checkSubscription(userId);

    return (
      <ChatLayout
        sidebar={
          <ChatSideBar
            chats={data.allChats}
            chatId={parseInt(chatId)}
            isPro={isPro}
          />
        }
        pdfViewer={
          <PDFViewer
            pdf_url={data.currentChat.pdfUrl}
          />
        }
        chat={<ChatComponent chatId={parseInt(chatId)} />}
        pdfName={data.currentChat.pdfName}
      />


    );
  } catch (error) {
    console.error("Error in ChatPage:", error);
    redirect("/");
  }
}
