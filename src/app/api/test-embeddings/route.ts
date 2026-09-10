import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/gemini-embeddings";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const embeddings = await getEmbeddings(text);
    
    return NextResponse.json({
      success: true,
      embeddingType: typeof embeddings,
      isArray: Array.isArray(embeddings),
      length: Array.isArray(embeddings) ? embeddings.length : Object.keys(embeddings).length,
      firstFewValues: Array.isArray(embeddings) ? embeddings.slice(0, 5) : Object.values(embeddings).slice(0, 5)
    });

  } catch (error: any) {
    console.error("Test embeddings error:", error);
    return NextResponse.json({
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}
