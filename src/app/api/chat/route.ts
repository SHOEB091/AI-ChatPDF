import { GoogleGenerativeAI } from "@google/generative-ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { genAI } from "@/lib/gemini-config";
import { generateTextDirect, listAvailableModels } from "@/lib/gemini-direct-api";
import { Message as AIMessage } from "ai";

// Fix: Explicitly avoiding edge runtime as it's incompatible with fs module
// export const runtime = "nodejs";

// Helper function to create a simple JSON response
function createSimpleResponse(content: string) {
  return NextResponse.json({
    id: Date.now().toString(),
    content: content,
    role: "assistant",
    createdAt: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    console.log("1. Starting chat request...");

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const { messages, chatId } = await req.json();
    console.log("3. Received request with chatId:", chatId);

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      console.log("5. Chat not found for id:", chatId);
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    
    const fileKey = _chats[0].fileKey;
    console.log("6. Found fileKey:", fileKey);
    const lastMessage = messages[messages.length - 1];
    console.log("7. Last message:", lastMessage);
    
    let context = "";
    try {
      console.log("8. Getting context for message...");
      context = await getContext(lastMessage.content, fileKey);
      console.log("9. Retrieved context length:", context?.length || 0);
    } catch (err) {
      console.error("Error getting context:", err);
      // Continue without context if there's an error
    }

    // Create a prompt based on whether context is available or not
    let systemPrompt = "";
    if (context && context.length > 0) {
      systemPrompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.`;
    } else {
      // If no context is available, provide a helpful message about the technical issue
      const currentChat = _chats[0];
      const documentName = currentChat.pdfName || "the uploaded document";

      systemPrompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and is eager to provide vivid and thoughtful responses to the user.

      The user has uploaded a document called "${documentName}". However, you are currently unable to access the specific content of this document due to a technical issue with the document processing system.

      Please let the user know that:
      1. You cannot access the specific content of their document right now
      2. There seems to be a technical issue with the document processing
      3. They may want to try uploading the document again
      4. You can provide general information about the topic if they describe what the document is about

      Be helpful, apologetic about the technical limitation, and offer alternative ways to assist them.`;

      console.log("No context available, using technical limitation prompt");
    }

    // Save user message to database
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    console.log('Sending message to Gemini with context length:', context?.length || 0);
    
    // Send message to Gemini
    console.log("10. Sending message to Gemini...");
    const prompt = `${systemPrompt}\n\nQuestion: ${lastMessage.content}`;
    console.log("11. Final prompt length:", prompt.length);
    
    // Get response from Gemini
    console.log("Sending prompt to Gemini...");
    let responseText = ""; // Initialize with empty string to fix type issues
    
    try {
      // Get the list of available models first 
      const availableModels = await listAvailableModels(process.env.GEMINI_API_KEY || "");
      console.log("Available models from API:", availableModels);
      
      // Choose the first available Flash model (they're more reliable for free tier)
      const flashModel = availableModels.find((m) => 
        m.includes('flash') && !m.includes('preview')
      ) || "models/gemini-1.5-flash";
      
      console.log(`Using model: ${flashModel}`);
      const model = genAI.getGenerativeModel({ 
        model: flashModel,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        }
      });
      
      // Generate content with the selected model
      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('No response received from Gemini');
      }
      
      const response = await result.response;
      responseText = response.text();
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }
      
      console.log("Received response from Gemini:", responseText.substring(0, 100) + "...");
      
      // Save assistant's message to database
      await db.insert(_messages).values({
        chatId,
        content: responseText,
        role: "assistant",
      });
      
      // Return response in JSON format
      return createSimpleResponse(responseText);
      
    } catch (error: any) {
      console.error('Error getting response from Gemini:', error);
      
      // Handle API version or model not found errors
      if (error?.message?.includes('not found for API version') || 
          (error?.message?.includes('models/') && error?.message?.includes('not found'))) {
        console.error('Invalid model name or API version. Trying direct API approach...');
        
        try {
          // Use direct API call as a last resort
          responseText = await generateTextDirect(prompt, process.env.GEMINI_API_KEY || "");
          console.log("Direct API call succeeded!");
          console.log("Response preview:", responseText.substring(0, 100) + "...");
          
          // Save assistant's message to database
          await db.insert(_messages).values({
            chatId,
            content: responseText,
            role: "assistant",
          });
          
          // Return response in JSON format
          return createSimpleResponse(responseText);
        } catch (directError: any) {
          console.error("Direct API call failed too:", directError);
          
          // Provide a fallback response if everything fails
          responseText = "I'm sorry, but I'm having trouble accessing my knowledge right now. " +
            "Please try again later or contact support if this issue persists.";
            
          // Save fallback response and return
          await db.insert(_messages).values({
            chatId,
            content: responseText,
            role: "assistant",
          });
          
          // Return response in JSON format
          return createSimpleResponse(responseText);
        }
      } else {
        // For other errors, return a user-friendly error response
        return NextResponse.json(
          { error: 'Unable to connect to AI service. Please try again later.' },
          { status: 503 }
        );
      }
    }
  } catch (error: any) {
    console.error("Chat API error:", {
      name: error?.name || 'Unknown error',
      message: error?.message || 'No error message available',
      stack: error?.stack
    });
    
    // Check for specific errors
    if (error?.message?.includes('SAFETY')) {
      return NextResponse.json(
        { error: 'Content was filtered for safety reasons' },
        { status: 400 }
      );
    }
    
    if (error?.message?.includes('input too long')) {
      return NextResponse.json(
        { error: 'The input was too long for the model to process' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
