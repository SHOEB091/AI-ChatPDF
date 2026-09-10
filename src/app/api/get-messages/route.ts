import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Don't use edge runtime due to Node.js module compatibility issues
// export const runtime = "edge";

export const POST = async (req: Request) => {
  const { chatId } = await req.json();
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
};
