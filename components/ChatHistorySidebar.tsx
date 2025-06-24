'use client';

import { useState, useEffect } from 'react';
import { Trash2, Clock, MessageSquare, ChevronLeft, ChevronRight, Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistorySidebarProps {
  username: string;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ 
  username, 
  currentSessionId, 
  onSessionSelect, 
  onNewChat 
}: ChatHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (username) {
      fetchChatHistory();
    }
  }, [username, retryCount]);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      console.log("Fetching chat history for username:", username);
      
      // Add a timeout to the fetch to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      const response = await fetch(`/api/chat/history?username=${encodeURIComponent(username)}`, {
        signal: controller.signal,
        // Add cache control to avoid stale responses
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log("Chat history response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response (${response.status}):`, errorText);
        throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.chatSessions?.length || 0} chat sessions`);
      setChatSessions(data.chatSessions || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setIsError(true);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load chat history",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    // Stop propagation to prevent selecting the chat while deleting
    event.stopPropagation();
    
    try {
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat session');
      }
      
      // Remove the deleted session from state
      setChatSessions(prev => prev.filter(session => session.sessionId !== sessionId));
      
      toast({
        title: "Success",
        description: "Chat session deleted",
        duration: 3000,
      });
      
      // If the deleted session was the current one, start a new chat
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'w-72' : 'w-4'} group`}>
      <div className={`relative h-full flex flex-col border-r border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-lg transition-all duration-300 ${isOpen ? 'bg-white/80 dark:bg-gray-900/80' : 'bg-transparent hover:bg-white/40 dark:hover:bg-gray-900/40'} ${isOpen ? '' : 'hover:shadow-lg'}`}>
        {/* Header always present */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between h-20 min-h-[5rem]">
          <span className={`font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>Chats</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-2 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={20} />
          </button>
        </div>
        {isOpen && (
          <>
            {/* Chat History List */}
            <ScrollArea className="flex-1 px-2 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : isError ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="mx-auto h-8 w-8 mb-2 opacity-50">⚠️</div>
                  <p className="mb-3">Failed to load chat history</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRetryCount(prev => prev + 1)}
                    className="mx-auto"
                  >
                    Retry
                  </Button>
                </div>
              ) : chatSessions.length > 0 ? (
                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      onClick={() => onSessionSelect(session.sessionId)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/40 ${
                        session.sessionId === currentSessionId ? 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/60 dark:to-purple-900/60 border-blue-400 shadow-md' : 'bg-white/60 dark:bg-gray-900/60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">
                          {session.title}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="mr-1" />
                          <span>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => handleDeleteSession(session.sessionId, e)}
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 ml-2"
                        title="Delete chat"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No chat history yet</p>
                </div>
              )}
            </ScrollArea>
            {/* New Chat Button at the bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <Button 
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700"
                variant="default"
                size="lg"
              >
                <MessageSquare size={18} />
                <span>New Chat</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
