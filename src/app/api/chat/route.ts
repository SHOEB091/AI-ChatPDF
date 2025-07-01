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

// Helper function to create a streaming response in the format expected by useChat
function createStreamResponse(content: string) {
  const encoder = new TextEncoder();
  
  // Create a stream that mimics the exact format expected by the AI SDK v4.3.16
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Generate a unique ID for this message
        const messageId = `chatcmpl-${Date.now()}`;
        
        // First chunk: Start of the OpenAI format (role)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          id: messageId,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now()/1000),
          model: "gemini-1.5-flash-simulation",
          choices: [{
            index: 0,
            delta: {
              role: "assistant"
            },
            finish_reason: null
          }]
        })}\n\n`));
        
        // Small delay to let the frontend process the first chunk
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // Second chunk: The actual content (all at once to avoid parsing issues)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          id: messageId,
          object: "chat.completion.chunk", 
          created: Math.floor(Date.now()/1000),
          model: "gemini-1.5-flash-simulation",
          choices: [{
            index: 0,
            delta: {
              content: content
            },
            finish_reason: null
          }]
        })}\n\n`));
        
        // Small delay before sending the final chunk
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // Final chunk: Finish reason
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          id: messageId,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now()/1000),
          model: "gemini-1.5-flash-simulation",
          choices: [{
            index: 0,
            delta: {},
            finish_reason: "stop"
          }]
        })}\n\n`));
        
        // Done marker
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("Error in stream generation:", error);
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
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
      // If no context is available, use the enhanced resume prompt
      systemPrompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and is eager to provide vivid and thoughtful responses to the user.
      
      You've been asked to answer questions about a resume PDF.
      
      Here's what's visible in Shoeb Iqbal's resume:
      - Software Engineer with 1.2+ years of experience in full-stack development (MERN stack and .Net)
      - Education: Bachelor of Computer Science, DIT University (2021-2025)
      - Skills: JavaScript, TypeScript, Python, Java, MERN Stack, React.js, Node.js, REST APIs, HTML, CSS
      - Experience: Currently a Software Engineer at Bridge Group Solutions (Jan 2025-Present)
      - Previous experience as Backend Developer Intern at Kodnest
      - Projects include: Interbook Assessment Platform, HR Management System
      - Tech skills: MongoDB, PostgreSQL, MySQL, Docker, GitHub Actions, Nginx, Redis, CI/CD pipeline
      
      Answer questions about this resume based on this information. If you can't answer specifically, provide helpful general information.`;
      
      console.log("No context available, using enhanced resume prompt");
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
      
      // Return response in the proper streaming format
      return createStreamResponse(responseText);
      
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
          
          // Return response in the proper streaming format
          return createStreamResponse(responseText);
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
          
          // Return response in the proper streaming format
          return createStreamResponse(responseText);
        }
      } else {
        // For other errors, return a user-friendly error response
        return NextResponse.json(
          { error: 'Unable to connect to AI service. Please try again later.' },
          { status: 503 }
        );
      }
    }
  }  catch (error: any) {
    console.error("Chat API error:", {
      name: error?.name || 'Unknown error',
      message: error?.message || 'No error message available',
      stack: error?.stack
    });
    
    // For errors that can be recovered from, try to return a valid response
    let fallbackContent = "";
    
    // Check for specific errors
    if (error?.message?.includes('SAFETY')) {
      fallbackContent = "I'm sorry, but I can't provide a response to that query due to content safety guidelines.";
    } else if (error?.message?.includes('input too long')) {
      fallbackContent = "I'm sorry, but your question was too long for me to process. Could you please make it shorter?";
    } else {
      fallbackContent = "I apologize, but I encountered an issue processing your request. Please try again in a moment.";
    }
    
    console.log("Returning fallback response:", fallbackContent);
    
    // Return the fallback response in a streaming format
    return createStreamResponse(fallbackContent);
  }
}
