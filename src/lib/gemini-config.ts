import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in .env.local file');
}

// List of models to try, in order of preference - must use exact names from ListModels API
export const geminiModels = {
  embeddings: "models/embedding-001", 
  text: [
    "models/gemini-1.5-flash", // Try flash models first (faster, cheaper quota)
    "models/gemini-1.5-flash-002",
    "models/gemini-1.5-pro",
    "models/gemini-1.5-pro-002",
    "models/gemini-1.0-pro-vision-latest"
  ]
};

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: geminiModels.text[0]  // Start with the first model in the list
};

export const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
