/**
 * Direct API client for Google's Gemini API
 * This is a fallback mechanism in case the official library doesn't work
 */

import axios from 'axios';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1';

/**
 * Generate text using Gemini API directly
 */
export async function generateTextDirect(prompt: string, apiKey: string): Promise<string> {
  try {
    console.log("Attempting direct API call to Gemini...");
    
    // Use models/gemini-1.5-flash which is available in the list
    const url = `${GEMINI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const data = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
      }
    };
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data) {
      const content = response.data.candidates?.[0]?.content;
      if (content && content.parts && content.parts.length > 0) {
        return content.parts[0].text || "No text generated";
      }
    }
    
    throw new Error(`Invalid response from Gemini API: ${JSON.stringify(response.data)}`);
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: unknown }, message?: string };
    console.error("Direct API call failed:", 
      errorObj.response?.data || 
      (error instanceof Error ? error.message : String(error)));
    throw error;
  }
}

/**
 * List available models using direct API call
 */
export async function listAvailableModels(apiKey: string): Promise<string[]> {
  try {
    console.log("Listing available Gemini models...");
    
    const url = `${GEMINI_BASE_URL}/models?key=${apiKey}`;
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data && response.data.models) {
      return response.data.models.map((model: { name: string }) => model.name);
    }
    
    return [];
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: unknown }, message?: string };
    console.error("Failed to list models:", 
      errorObj.response?.data || 
      (error instanceof Error ? error.message : String(error)));
    return [];
  }
}
