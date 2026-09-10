"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

const TypingIndicator = ({ 
  isVisible, 
  message = "AI is thinking...", 
  className 
}: TypingIndicatorProps) => {
  const [dots, setDots] = React.useState("");

  React.useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        {message}{dots}
      </span>
    </div>
  );
};

export default TypingIndicator;
