import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Loader2 } from "lucide-react";
import React from "react";

type Props = {
  messages: Message[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 text-gray-500">
        <p className="text-sm">No messages yet.</p>
        <p className="text-xs mt-1">Ask a question about your PDF to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        
        return (
          <div
            key={message.id}
            className={cn("flex items-end gap-2 px-2", {
              "justify-end": isUser,
            })}
          >
            {/* Message Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-2 max-w-[85%] break-words",
                {
                  "bg-blue-600 text-white": isUser,
                  "bg-gray-200 text-gray-700": !isUser,
                }
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Role Indicator */}
            <div
              className={cn(
                "text-xs text-gray-500 self-end mb-2",
                {
                  "order-first": !isUser,
                  "order-last": isUser,
                }
              )}
            >
              {isUser ? "You" : "AI"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
