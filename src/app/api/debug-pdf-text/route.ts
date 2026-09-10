import { NextResponse } from "next/server";
import { downloadFromS3 } from "@/lib/s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    console.log("=== DEBUG PDF TEXT EXTRACTION ===");
    console.log("FileKey:", fileKey);

    // Step 1: Download from S3
    let downloadPath;
    try {
      console.log("Downloading from S3...");
      downloadPath = await downloadFromS3(fileKey);
      console.log("Downloaded to:", downloadPath);
    } catch (error: any) {
      return NextResponse.json({
        error: "S3 download failed",
        details: error.message
      }, { status: 500 });
    }

    // Step 2: Extract text from PDF
    try {
      console.log("Loading PDF...");
      const loader = new PDFLoader(downloadPath);
      const pages = await loader.load();
      
      console.log("PDF loaded, pages:", pages.length);
      
      const textExtractionResults = pages.map((page, index) => ({
        pageNumber: index + 1,
        textLength: page.pageContent.length,
        textPreview: page.pageContent.substring(0, 200),
        hasText: page.pageContent.trim().length > 0
      }));

      const totalTextLength = pages.reduce((sum, page) => sum + page.pageContent.length, 0);
      const pagesWithText = pages.filter(page => page.pageContent.trim().length > 0).length;

      return NextResponse.json({
        success: true,
        fileKey,
        downloadPath,
        totalPages: pages.length,
        pagesWithText,
        totalTextLength,
        textExtractionResults,
        fullTextPreview: pages.map(p => p.pageContent).join('\n').substring(0, 1000)
      });

    } catch (error: any) {
      console.error("PDF text extraction failed:", error);
      return NextResponse.json({
        error: "PDF text extraction failed",
        details: error.message,
        stack: error.stack
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Debug PDF text error:", error);
    return NextResponse.json({
      error: error.message || "Unknown error",
      stack: error.stack
    }, { status: 500 });
  }
}
