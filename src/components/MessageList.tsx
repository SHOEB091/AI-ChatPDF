import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Copy, User, Bot, Check, ThumbsUp, ThumbsDown, Heart, MessageSquare, MoreHorizontal, Edit3, Save, X } from "lucide-react";
import React from "react";

type Props = {
  messages: Message[];
  onEditMessage?: (messageId: string, newContent: string) => void;
};

const MessageList = ({ messages, onEditMessage }: Props) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [reactions, setReactions] = React.useState<Record<string, string>>({});
  const [hoveredMessage, setHoveredMessage] = React.useState<string | null>(null);
  const [editingMessage, setEditingMessage] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState<string>("");
  const [editedMessages, setEditedMessages] = React.useState<Set<string>>(new Set());

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Bot className="w-10 h-10 text-blue-600" />
        </div>
        <div className="max-w-md space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Welcome to your AI Assistant!</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            I'm here to help you understand your PDF. You can ask me to:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-4">
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <span>📄</span>
              <span>Summarize content</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <span>🔍</span>
              <span>Find specific info</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <span>💡</span>
              <span>Explain concepts</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <span>❓</span>
              <span>Answer questions</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Try the quick actions below or type your own question!
          </p>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const addReaction = (messageId: string, reaction: string) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId] === reaction ? '' : reaction
    }));
  };

  const getReactionEmoji = (reaction: string) => {
    switch (reaction) {
      case 'like': return '👍';
      case 'dislike': return '👎';
      case 'love': return '❤️';
      case 'thinking': return '🤔';
      default: return '';
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const saveEdit = () => {
    if (editingMessage && onEditMessage && editContent.trim()) {
      onEditMessage(editingMessage, editContent.trim());
      setEditedMessages(prev => new Set([...prev, editingMessage]));
      setEditingMessage(null);
      setEditContent("");
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const showAvatar = index === 0 || messages[index - 1]?.role !== message.role;

        return (
          <div
            key={message.id}
            className={cn("flex gap-3 group transition-all duration-200", {
              "flex-row-reverse": isUser,
            })}
            onMouseEnter={() => setHoveredMessage(message.id)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            {/* Avatar */}
            {showAvatar && (
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg transition-transform hover:scale-105",
                  {
                    "bg-gradient-to-br from-blue-500 to-blue-600": isUser,
                    "bg-gradient-to-br from-purple-500 to-purple-600": !isUser,
                  }
                )}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
            )}

            {/* Spacer when no avatar */}
            {!showAvatar && <div className="w-8" />}

            {/* Message Content */}
            <div className={cn("flex flex-col max-w-[75%] min-w-0", {
              "items-end": isUser,
              "items-start": !isUser,
            })}>
              {/* Message Bubble */}
              <div
                className={cn(
                  "relative px-4 py-3 rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group/message min-w-0 max-w-full",
                  {
                    "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500/20 shadow-blue-500/20": isUser,
                    "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-gray-200/50 dark:shadow-gray-800/50": !isUser,
                  },
                  editingMessage === message.id && "ring-2 ring-blue-500/20"
                )}
              >
                {editingMessage === message.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/70"
                      rows={3}
                      placeholder="Edit your message..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        title="Cancel edit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        onClick={saveEdit}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        title="Save changes"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-12">
                    {message.content}
                  </p>
                )}

                {/* Action Buttons */}
                {editingMessage !== message.id && (
                  <div className={cn(
                    "absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover/message:opacity-100 transition-all duration-200 rounded-md p-0.5",
                    hoveredMessage === message.id && "opacity-100",
                    {
                      "bg-white/20 backdrop-blur-sm": isUser,
                      "bg-black/5 dark:bg-white/10 backdrop-blur-sm": !isUser,
                    }
                  )}>
                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className={cn(
                        "p-0.5 rounded hover:scale-110 transition-all duration-200",
                        {
                          "text-white/80 hover:text-white hover:bg-white/20": isUser,
                          "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700": !isUser,
                        }
                      )}
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>

                    {/* Edit Button - Only for user messages */}
                    {isUser && onEditMessage && (
                      <button
                        onClick={() => startEditing(message)}
                        className={cn(
                          "p-0.5 rounded hover:scale-110 transition-all duration-200",
                          "text-white/80 hover:text-white hover:bg-white/20"
                        )}
                        title="Edit message"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {/* More Actions Button */}
                    <button
                      className={cn(
                        "p-0.5 rounded hover:scale-110 transition-all duration-200",
                        {
                          "text-white/80 hover:text-white hover:bg-white/20": isUser,
                          "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700": !isUser,
                        }
                      )}
                      title="More actions"
                    >
                      <MoreHorizontal className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Reactions */}
              {!isUser && (
                <div className={cn(
                  "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200",
                  hoveredMessage === message.id && "opacity-100"
                )}>
                  {['like', 'dislike', 'love', 'thinking'].map((reaction) => (
                    <button
                      key={reaction}
                      onClick={() => addReaction(message.id, reaction)}
                      className={cn(
                        "p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110",
                        reactions[message.id] === reaction && "bg-blue-100 ring-2 ring-blue-500/20"
                      )}
                      title={`React with ${reaction}`}
                    >
                      <span className="text-sm">
                        {reaction === 'like' && <ThumbsUp className="w-3 h-3" />}
                        {reaction === 'dislike' && <ThumbsDown className="w-3 h-3" />}
                        {reaction === 'love' && <Heart className="w-3 h-3" />}
                        {reaction === 'thinking' && '🤔'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Show active reaction */}
              {reactions[message.id] && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{getReactionEmoji(reactions[message.id])}</span>
                  <span className="text-xs text-gray-500">You reacted</span>
                </div>
              )}

              {/* Timestamp and Edit Indicator */}
              {message.createdAt && (
                <div
                  className={cn(
                    "text-xs text-gray-400 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2",
                    {
                      "text-right justify-end": isUser,
                      "text-left justify-start": !isUser,
                    }
                  )}
                >
                  <span>{formatTime(message.createdAt)}</span>
                  {editedMessages.has(message.id) && (
                    <span className="text-xs text-gray-400 italic">(edited)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
