import { db } from "@/lib/db";
import { messages as _messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { chatId } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }
    
    // Get the most recent message for this chat
    const messages = await db
      .select()
      .from(_messages)
      .where(eq(_messages.chatId, chatId))
      .orderBy(desc(_messages.id))  // Order by id DESC (most recent first)
      .limit(1);
    
    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 });
    }
    
    const latestMessage = messages[0];
    
    // Return the latest message directly
    return NextResponse.json({
      id: latestMessage.id.toString(),
      role: latestMessage.role,
      content: latestMessage.content,
      createdAt: latestMessage.createdAt
    });
  } catch (error) {
    console.error("Error in fallback-chat route:", error);
    return NextResponse.json(
      { error: "Failed to get latest message" }, 
      { status: 500 }
    );
  }
}
