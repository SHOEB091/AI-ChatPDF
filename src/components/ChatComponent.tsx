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
  const { data, isLoading, refetch } = useQuery({
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

  const { input, handleInputChange, handleSubmit, messages, isLoading: isChatLoading } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: data || [],
    onResponse: (response) => {
      // After getting a response, refetch messages to ensure UI is updated
      console.log("Chat response received, refreshing messages");
      refetch();
    },
    onError: (error) => {
      console.error("Chat error:", error);
    }
  });

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
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
