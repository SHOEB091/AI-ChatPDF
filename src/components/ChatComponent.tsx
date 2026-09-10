"use client";
import React from "react";


import { Input } from "./ui/input";
// Removed useChat import - using custom implementation
import { Button } from "./ui/button";
import { Send, ArrowDown, Sparkles, FileText, Languages } from "lucide-react";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Message } from "ai";
import { cn } from "@/lib/utils";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      console.log("Fetched messages:", response.data);
      return response.data;
    },
  });

  // Custom chat implementation without streaming
  const [input, setInput] = React.useState("");
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(data || []);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([
    "Summarize this document",
    "What are the key points?",
    "Explain the main concepts",
    "Translate to simple terms"
  ]);
  const [aiStatus, setAiStatus] = React.useState<string>("Ready to help!");

  // Smart status messages based on context
  const getAiStatusMessage = () => {
    if (isChatLoading) {
      const messages = [
        "Analyzing your PDF content...",
        "Processing your question...",
        "Searching through the document...",
        "Generating a thoughtful response...",
        "Almost done thinking..."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    if (messages.length === 0) {
      return "Ready to answer questions about your PDF!";
    }

    if (messages.length > 5) {
      return "Great conversation! What else would you like to know?";
    }

    return "How can I help you understand this document better?";
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messageContainerRef = React.useRef<HTMLDivElement>(null);

  // Update messages when data changes
  React.useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  // Auto-scroll to bottom and handle scroll button
  React.useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle scroll detection for scroll button
  React.useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 3);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // Typing simulation
  React.useEffect(() => {
    if (input.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [input]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="question"]') as HTMLInputElement;
        input?.focus();
      }

      // Escape to clear input
      if (e.key === 'Escape') {
        setInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update AI status based on context
  React.useEffect(() => {
    setAiStatus(getAiStatusMessage());
  }, [messages.length, isChatLoading]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickAction = (action: string) => {
    const actionPrompts = {
      summarize: "Please provide a comprehensive summary of this document.",
      explain: "Can you explain the main concepts in this document in simple terms?",
      translate: "Please translate the key points of this document into simpler language.",
      keypoints: "What are the most important key points from this document?"
    };

    setInput(actionPrompts[action as keyof typeof actionPrompts] || action);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };



  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Update the message in the local state
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, content: newContent } : msg
    ));

    // Here you could also update the message in the database
    // For now, we'll just update locally
    try {
      // Optional: Send update to backend
      // await axios.put(`/api/messages/${messageId}`, { content: newContent });
    } catch (error) {
      console.error('Error updating message:', error);
      // Revert the change if backend update fails
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, content: messageId } : msg
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      createdAt: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsChatLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        messages: [...messages, userMessage],
        chatId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.content,
        role: "assistant",
        createdAt: new Date(response.data.createdAt)
      };

      setMessages(prev => [...prev, assistantMessage]);
      refetch(); // Refresh to sync with database
    } catch (error) {
      console.error("Chat error:", error);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  };

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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
      {/* Messages Container */}
      <div
        ref={messageContainerRef}
        id="message-container"
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
            </div>
            <p className="text-sm text-gray-600 mt-4 animate-pulse">Loading your conversation...</p>
          </div>
        ) : (
          <div className="relative">
            <MessageList messages={messages} onEditMessage={handleEditMessage} />

            {/* Enhanced Typing Indicator */}
            {isChatLoading && (
              <div className="flex items-center justify-center p-6">
                <TypingIndicator
                  isVisible={isChatLoading}
                  message={getAiStatusMessage()}
                />
              </div>
            )}

            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-6 z-10 w-10 h-10 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                title="Scroll to bottom"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}

            {/* Messages end marker for auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleQuickAction('summarize')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded-full transition-all duration-200 hover:scale-105"
              >
                <FileText className="w-3 h-3" />
                Summarize
              </button>
              <button
                onClick={() => handleQuickAction('explain')}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm rounded-full transition-all duration-200 hover:scale-105"
              >
                <Sparkles className="w-3 h-3" />
                Explain
              </button>
              <button
                onClick={() => handleQuickAction('translate')}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm rounded-full transition-all duration-200 hover:scale-105"
              >
                <Languages className="w-3 h-3" />
                Simplify
              </button>
              <button
                onClick={() => handleQuickAction('keypoints')}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm rounded-full transition-all duration-200 hover:scale-105"
              >
                <span className="text-xs">📝</span>
                Key Points
              </button>
            </div>
          </div>
        )}



        {/* Suggestions */}
        {input.length === 0 && messages.length > 0 && (
          <div className="px-4 pt-2 pb-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full transition-all duration-200 hover:scale-105"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 p-4 max-w-4xl mx-auto"
        >
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={
                messages.length === 0
                  ? "Ask your first question about the PDF..."
                  : "Continue the conversation..."
              }
              disabled={isChatLoading}
              className={cn(
                "min-h-[48px] pr-12 py-3 text-sm rounded-2xl border-2 transition-all duration-200 resize-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500",
                "placeholder:text-gray-400 bg-gray-50/50 hover:bg-white focus:bg-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isTyping && "ring-2 ring-blue-500/10 border-blue-500/30"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />



            {/* Character count */}
            {input.length > 0 && (
              <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                {input.length}/1000
              </div>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isChatLoading}
            className={cn(
              "h-12 w-12 rounded-2xl shadow-lg transition-all duration-200 relative overflow-hidden",
              "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-600",
              "hover:scale-105 active:scale-95",
              input.trim() && !isChatLoading && "ring-2 ring-blue-500/20 shadow-blue-500/25"
            )}
          >
            {isChatLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className={cn(
                  "h-4 w-4 transition-all duration-200",
                  input.trim() && "scale-110"
                )} />
                {input.trim() && (
                  <div className="absolute inset-0 bg-white/10 animate-pulse rounded-2xl" />
                )}
              </>
            )}
          </Button>
        </form>


      </div>
    </div>
  );
};

export default ChatComponent;
