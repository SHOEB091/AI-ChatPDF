import { GoogleGenerativeAI } from "@google/generative-ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const systemPrompt = `You are a helpful AI assistant. You have access to the following context about a document:
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    
    Only use information from the context to answer questions. If the context doesn't provide the answer, say "I'm sorry, but I don't know the answer to that question."
    Don't make up or invent information not present in the context.`;

    // Save user message to database
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    // Initialize Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Start the chat
    const chat = model.startChat({
      history: messages.map((msg: Message) => ({
        role: msg.role,
        parts: msg.content,
      })),
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Stream the response
    const result = await chat.sendMessageStream(lastMessage.content);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Save assistant's message to database
    let fullResponse = '';
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += new TextDecoder().decode(value);
    }

    await db.insert(_messages).values({
      chatId,
      content: fullResponse,
      role: "assistant",
    });

    return new Response(stream);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
