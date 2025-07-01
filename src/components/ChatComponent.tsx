"use client";
import React from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Message } from "ai";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const { data: initialMessages, isLoading, refetch } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      try {
        if (!chatId) {
          console.error("Missing chatId when fetching messages");
          return [];
        }
        
        const response = await axios.post<Message[]>("/api/get-messages", {
          chatId,
        });
        
        console.log("Fetched messages:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
  });

  // Track message state and loading
  const [messageError, setMessageError] = React.useState(false);
  const [fallbackAttempted, setFallbackAttempted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Configure chat with simplified error handling
  const { 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit,
    messages, 
    isLoading: isChatLoading,
    error,
    setMessages
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: initialMessages || [],
    id: `chat-${chatId}`,
    onResponse: (response) => {
      console.log("Chat response received:", response.status);
      if (response.ok) {
        setMessageError(false);
        setFallbackAttempted(false);
      } else {
        setMessageError(true);
        console.error("Response error:", response.statusText);
        // Will trigger fallback in useEffect
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessageError(true);
      // Will trigger fallback in useEffect
    },
    onFinish: (message) => {
      setIsSubmitting(false);
      console.log("Message finished:", message);
      // Ensure messages are up-to-date by re-fetching
      setTimeout(() => refetch(), 500);
    }
  });

  // Update messages when initialMessages changes
  React.useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);
  
  // Custom submit handler with loading state
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    setMessageError(false);
    setFallbackAttempted(false);
    await originalHandleSubmit(e);
  };
  
  // Fallback mechanism for when streaming fails
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (messageError && !fallbackAttempted && !isChatLoading) {
      console.log("Using fallback mechanism to get latest message");
      setFallbackAttempted(true);
      
      timeoutId = setTimeout(async () => {
        try {
          // Try to get the latest message from our fallback endpoint
          const response = await axios.post("/api/fallback-chat", { chatId });
          if (response.data && response.data.content) {
            console.log("Got fallback message:", response.data);
            // Add the fallback message to the messages state
            setMessages(prevMessages => [
              ...prevMessages,
              {
                id: response.data.id,
                role: response.data.role,
                content: response.data.content,
                createdAt: response.data.createdAt
              }
            ]);
          }
        } catch (err) {
          console.error("Fallback mechanism failed too:", err);
        } finally {
          setIsSubmitting(false);
        }
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messageError, fallbackAttempted, isChatLoading, chatId, refetch, setMessages]);

  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div
        id="message-container"
        className="flex-1 overflow-y-auto px-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div>
            <MessageList messages={messages} />
            {isChatLoading && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
              </div>
            )}
            {messageError && !isChatLoading && !isSubmitting && (
              <div className="flex flex-col items-center justify-center p-4 text-sm text-red-600">
                <p>Message is loading but not displaying correctly.</p>
                <Button 
                  onClick={() => {
                    refetch();
                  }}
                  variant="outline"
                  className="mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Refreshing...' : 'Refresh Messages'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white"
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask any question about your PDF..."
          className="flex-1 focus-visible:ring-1 focus-visible:ring-blue-500 border border-gray-300"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
