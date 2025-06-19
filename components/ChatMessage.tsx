'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownView } from './MarkdownView';

type MessageProps = {
  content: string;
  isUser?: boolean;
  timestamp?: Date;
};

export function ChatMessage({ content, isUser = false, timestamp = new Date() }: MessageProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-4 gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
        <div
        className={cn(
          "relative rounded-xl px-4 py-3 shadow-sm max-w-[85%] min-w-[50px]",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        )}
      >
        <MarkdownView 
          content={content}
          className={cn(
            "prose prose-sm max-w-none break-words overflow-hidden",
            isUser ? "prose-invert" : ""
          )}
        />
        <div className={cn(
          "text-xs mt-1 opacity-70",
          isUser ? "text-right" : "text-left"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
}
