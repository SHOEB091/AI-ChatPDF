"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle, FileText, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSideBar = ({ chats, chatId, isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<DrizzleChat | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const router = useRouter();

  const handleDeleteClick = (chat: DrizzleChat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete("/api/delete-chat", {
        data: { chatId: chatToDelete.id }
      });

      if (response.status === 200) {
        toast.success("Chat deleted successfully");

        // If the deleted chat is the current one, redirect to home
        if (chatToDelete.id === chatId) {
          router.push("/");
        } else {
          // Refresh the page to update the chat list
          window.location.reload();
        }
      }
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      toast.error(error?.response?.data?.error || "Failed to delete chat");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-all duration-300 relative",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        {!isCollapsed && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Chats</h1>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        <Link href="/">
          <Button
            className={cn(
              "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]",
              isCollapsed ? "w-8 h-8 p-0" : "w-full"
            )}
            size="sm"
            title={isCollapsed ? "New Chat" : undefined}
          >
            <PlusCircle className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "New Chat"}
          </Button>
        </Link>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className={cn("space-y-2", isCollapsed ? "p-2" : "p-4")}>
          {chats.length === 0 ? (
            !isCollapsed && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">No chats yet</p>
                <p className="text-xs text-gray-400">Upload a PDF to start chatting</p>
              </div>
            )
          ) : (
            chats.map((chat) => (
              <div key={chat.id} className="relative group">
                <Link href={`/chat/${chat.id}`}>
                  <div
                    className={cn(
                      "flex items-center text-sm rounded-xl transition-all duration-200 border",
                      isCollapsed ? "p-2 justify-center" : "gap-3 p-3 pr-10",
                      {
                        "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-blue-500/20 hover:from-blue-600 hover:to-blue-700": chat.id === chatId,
                        "text-gray-700 hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm": chat.id !== chatId,
                      }
                    )}
                    title={isCollapsed ? chat.pdfName : undefined}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      {
                        "bg-white/20": chat.id === chatId,
                        "bg-blue-50": chat.id !== chatId,
                      }
                    )}>
                      <FileText className={cn("w-4 h-4", {
                        "text-white": chat.id === chatId,
                        "text-blue-600": chat.id !== chatId,
                      })} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1 overflow-hidden text-sm font-medium">
                          {chat.pdfName}
                        </p>
                        <p className={cn("text-xs mt-0.5", {
                          "text-white/70": chat.id === chatId,
                          "text-gray-500": chat.id !== chatId,
                        })}>
                          <span suppressHydrationWarning>
                            {new Date(chat.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Delete Button */}
                {!isCollapsed && (
                  <button
                    onClick={(e) => handleDeleteClick(chat, e)}
                    className={cn(
                      "absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110",
                      {
                        "hover:bg-white/20 text-white/70 hover:text-white": chat.id === chatId,
                        "hover:bg-red-50 text-gray-400 hover:text-red-600": chat.id !== chatId,
                      }
                    )}
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subscription Button */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <SubscriptionButton isPro={isPro} />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        chatName={chatToDelete?.pdfName || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ChatSideBar;
