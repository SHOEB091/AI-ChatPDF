import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./gemini-embeddings";

// Flag to determine if we're in an environment that supports all Node.js dependencies
let canUsePinecone = true;

// Generic fallback context when Pinecone can't be used
const genericFallbackContext = `
I'm an AI assistant that can help you analyze and discuss documents.
I can answer questions about the content you've uploaded, provide summaries,
explain concepts, and help you understand the material better.
`;

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  if (!canUsePinecone) {
    console.log("Using mock data fallback instead of Pinecone");
    return [{
      id: "fallback-id",
      score: 0.1,
      metadata: {
        text: genericFallbackContext,
      }
    }];
  }

  try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const indexName = process.env.PINECONE_INDEX_NAME || "chatpdf";
    const pineconeIndex = client.index(indexName);
    const namespace = convertToAscii(fileKey);

    console.log(`Querying Pinecone - Index: ${indexName}, Namespace: ${namespace}, FileKey: ${fileKey}`);

    const namespaceIndex = pineconeIndex.namespace(namespace);
    const queryResult = await namespaceIndex.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });

    console.log(`Pinecone query result: ${queryResult.matches?.length || 0} matches found`);
    return queryResult.matches || [];
  } catch (error) {
    console.error("Error querying embeddings, using fallback:", error);
    canUsePinecone = false; // Disable Pinecone for future requests in this session
    
    // Return generic fallback data
    return [{
      id: "fallback-id",
      score: 0.1,
      metadata: {
        text: genericFallbackContext,
      }
    }];
  }
}

export async function getContext(query: string, fileKey: string) {
  try {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);
    
    console.log(`Found ${matches.length} total matches from vector DB`);
    
    // First try with high similarity threshold
    let qualifyingDocs = matches.filter(
      (match) => match.score && match.score > 0.7
    );
    
    // If no high-quality matches, use lower threshold
    if (qualifyingDocs.length === 0 && matches.length > 0) {
      console.log("No high-quality matches found, using lower threshold");
      qualifyingDocs = matches.filter(
        (match) => match.score && match.score > 0.5
      );
    }
    
    // If still no matches, use all available matches
    if (qualifyingDocs.length === 0 && matches.length > 0) {
      console.log("Using all available matches regardless of score");
      qualifyingDocs = [...matches];
    }
    
    console.log(`Using ${qualifyingDocs.length} qualifying docs with scores:`, 
      qualifyingDocs.map(m => m.score).join(", "));

    type Metadata = {
      text: string;
      pageNumber: number;
    };

    let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
    
    // Return concatenated text up to 3000 chars
    const result = docs.join("\n").substring(0, 3000);
    return result;
  } catch (error) {
    console.error("Error getting context:", error);
    return ""; // Return empty string on error
  }
}
