import { NextResponse } from "next/server";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { downloadFromS3 } from "@/lib/s3-server";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    console.log("=== DEBUG UPLOAD PROCESS ===");
    console.log("FileKey:", fileKey);

    // Step 1: Test S3 download
    let downloadResult;
    try {
      console.log("Step 1: Testing S3 download...");
      downloadResult = await downloadFromS3(fileKey);
      console.log("S3 download result:", downloadResult);
    } catch (error: any) {
      console.error("S3 download failed:", error);
      return NextResponse.json({
        error: "S3 download failed",
        step: "download",
        details: error.message
      }, { status: 500 });
    }

    // Step 2: Test full processing
    try {
      console.log("Step 2: Testing full document processing...");
      const result = await loadS3IntoPinecone(fileKey);
      console.log("Document processing completed successfully");
      
      return NextResponse.json({
        success: true,
        fileKey,
        downloadPath: downloadResult,
        processingResult: "completed",
        message: "Document processed successfully"
      });

    } catch (error: any) {
      console.error("Document processing failed:", error);
      return NextResponse.json({
        error: "Document processing failed",
        step: "processing",
        details: error.message,
        stack: error.stack
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Debug upload error:", error);
    return NextResponse.json({
      error: error.message || "Unknown error",
      stack: error.stack
    }, { status: 500 });
  }
}
