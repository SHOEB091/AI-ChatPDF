"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSideBar = ({ chats, chatId, isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
            size="sm"
          >
            <PlusCircle className="mr-2 w-4 h-4" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2 p-4">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn(
                  "flex items-center gap-2 p-3 text-sm rounded-lg hover:bg-gray-100 transition-colors",
                  {
                    "bg-blue-600 text-white hover:bg-blue-700": chat.id === chatId,
                    "text-gray-700": chat.id !== chatId,
                  }
                )}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <p className="line-clamp-1 overflow-hidden text-sm">
                  {chat.pdfName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Subscription Button */}
      <div className="p-4 border-t border-gray-200">
        <SubscriptionButton isPro={isPro} />
      </div>
    </div>
  );
};

export default ChatSideBar;
