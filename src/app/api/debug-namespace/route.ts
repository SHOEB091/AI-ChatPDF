import { NextResponse } from "next/server";
import { convertToAscii } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    const namespace = convertToAscii(fileKey);
    
    return NextResponse.json({
      success: true,
      originalFileKey: fileKey,
      convertedNamespace: namespace,
      areEqual: fileKey === namespace,
      originalLength: fileKey.length,
      convertedLength: namespace.length
    });

  } catch (error: any) {
    console.error("Debug namespace error:", error);
    return NextResponse.json({
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}
