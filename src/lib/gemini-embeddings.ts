import { GoogleGenerativeAI } from "@google/generative-ai";

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests (Gemini has higher rate limits)

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getEmbeddings(text: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Clean and truncate the text if necessary (Gemini has a token limit)
    text = text.replace(/\n/g, " ").trim();
    if (text.length > 8000) {  // Adjust this limit based on Gemini's requirements
      text = text.slice(0, 8000);
    }

    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await wait(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }

    console.log("Getting embeddings for text of length:", text.length);
    
    // Use the correct model name format
    const model = genAI.getGenerativeModel({ model: "models/embedding-001" });
    const result = await model.embedContent(text);
    const embedding = await result.embedding;

    lastRequestTime = Date.now();

    if (!embedding) {
      throw new Error("No embedding returned from Gemini");
    }

    // Convert embedding to array of numbers to match Pinecone's expected format
    return embedding.values;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting embeddings:", errorMessage);
    
    if (errorMessage.includes("quota")) {
      throw new Error(
        "Gemini API quota exceeded. Please check your quota at https://console.cloud.google.com/apis/dashboard"
      );
    }
    
    if (errorMessage.includes("rate limit")) {
      // Wait for 1 second and try again
      console.log("Rate limited, waiting 1 second...");
      await wait(1000);
      return getEmbeddings(text);
    }

    throw new Error(`Failed to get embeddings: ${errorMessage}`);
  }
}
