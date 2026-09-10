"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  pdfViewer: React.ReactNode;
  chat: React.ReactNode;
  pdfName: string;
}

const ChatLayout = ({ sidebar, pdfViewer, chat, pdfName }: ChatLayoutProps) => {
  const [isPdfVisible, setIsPdfVisible] = React.useState(true);

  return (
    <div className="flex-1 h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
          {pdfName}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] max-w-screen-2xl mx-auto gap-4 p-4 transition-all duration-300">
        {/* Sidebar */}
        <div className="flex-shrink-0 transition-all duration-300">
          {sidebar || (
            <div className="w-80 h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              Sidebar content not available
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        {isPdfVisible && (
          <div className="hidden md:block flex-1 min-w-0 transition-all duration-300">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
              <button
                onClick={() => setIsPdfVisible(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center shadow-md transition-all"
                title="Hide PDF viewer"
              >
                <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              {pdfViewer}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className={cn(
          "transition-all duration-300",
          isPdfVisible ? "w-96 flex-shrink-0" : "flex-1"
        )}>
          <div className="h-full bg-white dark:bg-gray-800 md:rounded-lg shadow-sm border-0 md:border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ask questions about your PDF</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThemeToggle variant="icon" />

                    {!isPdfVisible && (
                      <button
                        onClick={() => setIsPdfVisible(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm rounded-lg transition-all shadow-md"
                        title="Show PDF viewer"
                      >
                        <Eye className="w-4 h-4" />
                        Show PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {chat}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
