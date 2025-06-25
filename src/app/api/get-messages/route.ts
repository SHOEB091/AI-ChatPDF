import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Don't use edge runtime due to Node.js module compatibility issues
// export const runtime = "edge";

export const POST = async (req: Request) => {
  try {
    // Check if the request body is empty
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    // Parse the JSON
    const body = JSON.parse(text);
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId parameter" }, { status: 400 });
    }

    const _messages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId));
    
    // Format messages to match what useChat expects
    const formattedMessages = _messages.map(msg => ({
      id: msg.id.toString(),
      content: msg.content,
      role: msg.role,
      createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : undefined
    }));
    
    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error in get-messages route:", error);
    return NextResponse.json(
      { error: "Failed to get messages" }, 
      { status: 500 }
    );
  }
};
