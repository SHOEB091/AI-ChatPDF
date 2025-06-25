import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
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

export default async function ChatPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const chatId = params.chatId;
  if (!chatId || isNaN(parseInt(chatId))) {
    redirect("/");
  }

  try {
    const data = await getChatData(chatId, userId);
    if (!data?.currentChat) {
      redirect("/");
    }

    // TODO: Replace with actual pro status check
    const isPro = false; 

    return (
      <div className="flex max-h-screen overflow-scroll">
        <div className="flex w-full max-h-screen overflow-scroll">
          {/* Chat Sidebar */}
          <div className="flex-[1] max-w-xs">
            <ChatSideBar 
              chats={data.allChats}
              chatId={parseInt(chatId)}
              isPro={isPro}
            />
          </div>

          {/* PDF Viewer */}
          <div className="max-h-screen p-4 flex-[2]">
            <PDFViewer pdf_url={data.currentChat.pdfUrl} />
          </div>

          {/* Chat Component */}
          <div className="flex-[2] border-l-4 border-l-slate-200">
            <ChatComponent chatId={parseInt(chatId)} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ChatPage:", error);
    redirect("/");
  }
}
