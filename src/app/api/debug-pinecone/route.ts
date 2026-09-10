import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
    }

    // Check Pinecone configuration
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      return NextResponse.json({ 
        error: "Pinecone environment variables not set",
        hasApiKey: !!process.env.PINECONE_API_KEY,
        hasIndexName: !!process.env.PINECONE_INDEX_NAME
      }, { status: 500 });
    }

    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Check if index exists
    const indexes = await client.listIndexes();
    const indexName = process.env.PINECONE_INDEX_NAME!;
    const indexExists = indexes.indexes?.some(index => index.name === indexName);

    if (!indexExists) {
      return NextResponse.json({
        error: "Pinecone index does not exist",
        indexName,
        availableIndexes: indexes.indexes?.map(i => i.name) || []
      }, { status: 404 });
    }

    // Check namespace
    const pineconeIndex = client.index(indexName);
    const namespace = convertToAscii(fileKey);
    const namespaceIndex = pineconeIndex.namespace(namespace);

    // Get stats for this namespace
    const stats = await pineconeIndex.describeIndexStats();
    
    // Try to query the namespace with dummy vector
    const queryResult = await namespaceIndex.query({
      topK: 10,
      vector: new Array(768).fill(0), // Dummy vector
      includeMetadata: true,
    });

    // Also try to list all vectors in the namespace (if supported)
    let allVectors = null;
    try {
      const listResult = await namespaceIndex.listPaginated();
      allVectors = listResult.vectors || [];
    } catch (e) {
      console.log("List vectors not supported or failed:", e);
    }

    return NextResponse.json({
      success: true,
      fileKey,
      namespace,
      indexName,
      indexExists,
      totalVectors: stats.totalVectorCount || 0,
      namespaces: stats.namespaces || {},
      queryResults: queryResult.matches?.length || 0,
      firstMatch: queryResult.matches?.[0] || null,
      allVectorsList: allVectors?.slice(0, 5) || null, // First 5 vectors if available
      allVectorsCount: allVectors?.length || 0
    });

  } catch (error: any) {
    console.error("Debug Pinecone error:", error);
    return NextResponse.json({
      error: error.message || "Unknown error",
      stack: error.stack
    }, { status: 500 });
  }
}
