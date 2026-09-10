import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    // First, verify the chat belongs to the user
    const chatToDelete = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (chatToDelete.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chatToDelete[0].userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this chat" }, { status: 403 });
    }

    // Delete associated messages first (though CASCADE should handle this)
    await db.delete(messages).where(eq(messages.chatId, chatId));
    
    // Delete the chat
    await db.delete(chats).where(eq(chats.id, chatId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
