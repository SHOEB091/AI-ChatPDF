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

    // TODO: Replace with actual pro status check
    const isPro = false;

    return (
      <div className="flex-1 h-screen">
        {/* Main container with max width and proper spacing */}
        <div className="flex h-[calc(100vh-2rem)] max-w-screen-2xl mx-auto my-4 gap-4 px-4">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <ChatSideBar
              chats={data.allChats}
              chatId={parseInt(chatId)}
              isPro={isPro}
            />
          </div>

          {/* Center PDF Viewer */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <PDFViewer 
              pdf_url={data.currentChat.pdfUrl}
            />
          </div>

          {/* Right Chat Section */}
          <div className="w-96 flex-shrink-0 bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatComponent chatId={parseInt(chatId)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ChatPage:", error);
    redirect("/");
  }
}
