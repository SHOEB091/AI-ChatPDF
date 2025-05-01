import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { file_key, file_name } = await req.json();
    
    // Validate the request
    if (!file_key || !file_name) {
      return NextResponse.json(
        { error: "File key and name are required" },
        { status: 400 }
      );
    }

    // Create a PDF URL (this would be your S3 URL)
    const pdfUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file_key}`;

    // Insert the chat into the database
    const chat_id = await db
      .insert(chats)
      .values({
        pdfName: file_name,
        pdfUrl,
        userId,
        fileKey: file_key,
      })
      .returning({ id: chats.id });

    return NextResponse.json({ chat_id: chat_id[0].id });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
