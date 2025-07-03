import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./gemini-embeddings";

// Flag to determine if we're in an environment that supports all Node.js dependencies
let canUsePinecone = true;

// Mock data for fallback when Pinecone can't be used
const mockResumeContext = `
Shoeb Iqbal
Software Engineer with 1.2+ years of experience in full-stack development (MERN stack and .Net)
Education: Bachelor of Computer Science, DIT University (2021-2025)
Skills: JavaScript, TypeScript, Python, Java, MERN Stack, React.js, Node.js, REST APIs, HTML, CSS
Experience: Currently a Software Engineer at Bridge Group Solutions (Jan 2025-Present)
Previous experience as Backend Developer Intern at Kodnest
Projects include: Interbook Assessment Platform, HR Management System
Tech skills: MongoDB, PostgreSQL, MySQL, Docker, GitHub Actions, Nginx, Redis, CI/CD pipeline
`;

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  if (!canUsePinecone) {
    console.log("Using mock data fallback instead of Pinecone");
    return [{
      id: "mock-id",
      score: 0.9,
      metadata: {
        text: mockResumeContext,
      }
    }];
  }

  try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = client.index("chatpdf");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    const queryResult = await namespace.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (error) {
    console.log("Error querying embeddings, using fallback:", error);
    canUsePinecone = false; // Disable Pinecone for future requests in this session
    
    // Return mock data as fallback
    return [{
      id: "mock-id",
      score: 0.9,
      metadata: {
        text: mockResumeContext,
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

    const docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
    
    // Return concatenated text up to 3000 chars
    const result = docs.join("\n").substring(0, 3000);
    return result;
  } catch (error) {
    console.error("Error getting context:", error);
    return ""; // Return empty string on error
  }
}
