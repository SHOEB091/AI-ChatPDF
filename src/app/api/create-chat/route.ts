import { db, testConnection } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// /api/create-chat
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Check database connection first
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Check environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_INDEX_NAME) {
      console.error("Pinecone environment variables are not set");
      return NextResponse.json({ error: "Pinecone environment not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { file_key, file_name } = body;
    
    if (!file_key || !file_name) {
      return NextResponse.json(
        { error: "Missing file_key or file_name" },
        { status: 400 }
      );
    }
    
    console.log("Processing file upload:", { file_key, file_name });
    
    // Verify the file exists in S3 before proceeding
    const fileUrl = getS3Url(file_key);
    console.log("S3 URL:", fileUrl);
    
    try {
      console.log("Processing file...");
      // Load the file into existing Pinecone index
      await loadS3IntoPinecone(file_key);
      
      // Create chat entry in database
      const chat_id = await db
        .insert(chats)
        .values({
          fileKey: file_key,
          pdfName: file_name,
          pdfUrl: fileUrl,
          userId,
        })
        .returning({
          insertedId: chats.id,
        });

      console.log("Chat created:", chat_id[0].insertedId);
      
      return NextResponse.json(
        {
          chat_id: chat_id[0].insertedId,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error processing request:", error);
      
      if (error.message?.includes("free plan does not support")) {
        return NextResponse.json(
          { error: "Please ensure your Pinecone index is in the correct region for the free tier" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to process file or create chat" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
