"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, Moon, Sun, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/useTheme";
import { ChatMessage } from "@/components/ChatMessage";
import { MarkdownView } from "@/components/MarkdownView";
import { useToast } from "@/hooks/use-toast";
import { convertGcsUrlToHttps } from "@/lib/utils";
import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isHistory?: boolean; // Added to support history flag
}

interface ApiResponse {
  query: string;
  generated_response: string;
  error?: string;
}

export default function ChatPage() {
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [sidebarWidth, setSidebarWidth] = useState<number>(0);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDarkMode, toggleDarkMode, mounted } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initialized = useRef<boolean>(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedUsername = localStorage.getItem("chatbot-username");
    if (!storedUsername) {
      window.location.href = "/login";
      return;
    }
    setUsername(storedUsername);

    // Always start a new session on page load
    const newSessionId = `session-${uuidv4()}`;
    setSessionId(newSessionId);
    localStorage.setItem("current-session-id", newSessionId);

    // Add welcome message
    const welcomeMessage = `Welcome to Provana KMS! How can I help you today?`;
    setMessages([
      {
        id: `welcome-${newSessionId}`,
        content: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    // Do NOT call saveMessage here anymore
  }, []);

  // Save individual message to MongoDB
  const saveMessage = async (
    content: string,
    isUser: boolean,
    overrideUsername?: string
  ) => {
    try {
      // Skip saving hardcoded welcome messages
      if (!isUser && content.startsWith("Welcome to Provana KMS")) {
        console.log("Skipping welcome message - not saving to database");
        return { success: true, skipped: true };
      }

      const messageUsername = overrideUsername || username;
      if (!sessionId || !content || !messageUsername) {
        console.error("Missing required fields for saving message:", {
          hasSessionId: !!sessionId,
          hasContent: !!content,
          hasUsername: !!messageUsername,
        });
        return null;
      }
      console.log(`Saving individual ${isUser ? "user" : "AI"} message`);

      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          role: isUser ? "user" : "assistant",
          content: content,
          username: messageUsername, // Always include username
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        console.error("Error saving message:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          `Failed to save message: ${response.status} ${
            response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();
      console.log(
        `${isUser ? "User" : "AI"} message saved successfully:`,
        result
      );
      return result;
    } catch (error) {
      console.error("Error saving individual message:", error);
      // Don't show toast for every message save error to avoid overwhelming the user
      return null;
    }
  };

  const sendMessageToBackend = async (question: string) => {
    setIsTyping(true);

    // Add user message to state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: question,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Save the user message immediately
    await saveMessage(question, true);

    try {
      const username = localStorage.getItem("chatbot-username") || "guest";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      console.log("Sending request to API:", {
        query: question,
        client_name: username,
        sessionId: sessionId, // Include sessionId in logging
      });

      console.log(
        "Connecting to:",
        "https://kmaaivertexai-658439223400.us-central1.run.app/retrieve"
      );

      const res = await fetch(
        "https://kmaaivertexai-658439223400.us-central1.run.app/retrieve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          credentials: "omit",
          signal: controller.signal,
          body: JSON.stringify({
            query: question,
            client_name: username,
          }),
        }
      );

      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`API returned status: ${res.status}`);
      }

      console.log("Response status:", res.status);
      const data: ApiResponse = await res.json();
      console.log("API Response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.generated_response) {
        throw new Error("No response received from the API");
      }

      // Add bot response to state
      const processedResponse = convertGcsUrlToHttps(data.generated_response);
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: processedResponse,
        isUser: false,
        timestamp: new Date(),
      };

      // Log the AI response before adding it to the state
      console.log("AI response to be saved:", {
        content: processedResponse.substring(0, 100) + "...",
        isUser: false,
        timestamp: new Date(),
      });

      setMessages((prev) => [...prev, botMessage]);

      // Save the AI response immediately
      await saveMessage(processedResponse, false);

      // No need to call saveChatSession since we're saving messages individually
    } catch (e) {
      console.error("API Error:", e);
      // Add error message with more specific information
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content:
          e instanceof Error
            ? `Sorry, there was an error: ${e.message}`
            : "Sorry, there was an unexpected error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Save the error message to MongoDB as an AI response
      await saveMessage(errorMessage.content, false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    await sendMessageToBackend(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  // Start a new chat session
  const startNewChat = () => {
    // Generate a new session ID with UUID
    const newSessionId = `session-${uuidv4()}`;
    setSessionId(newSessionId);
    localStorage.setItem("current-session-id", newSessionId);

    // Prepare welcome message
    const welcomeMessage = `Welcome to Provana KMS! How can I help you today?`;

    // Clear all messages except the welcome message
    setMessages([
      {
        id: `welcome-${newSessionId}`,
        content: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    // Note: Welcome message is not saved to database as it's a hardcoded greeting

    // Reset input field
    setInputValue("");

    // Show toast notification
    toast({
      title: "New Chat Started",
      description: "Your previous conversation has been cleared.",
      duration: 3000,
    });
  };

  // Load a chat session by ID
  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);

      const response = await fetch(`/api/chat/${sessionId}`);

      if (!response.ok) {
        throw new Error("Failed to load chat session");
      }

      const { chatSession } = await response.json();

      if (chatSession) {
        // Update session ID and messages
        setSessionId(chatSession.sessionId);
        localStorage.setItem("current-session-id", chatSession.sessionId);

        // Transform messages to match our interface
        const formattedMessages = chatSession.messages.map((msg: any) => ({
          id: `msg-${msg._id || Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          content: msg.content,
          isUser: msg.isUser,
          timestamp: new Date(msg.timestamp),
          isHistory: true, // Mark as history
        }));

        setMessages(formattedMessages);

        toast({
          title: "Success",
          description: "Chat history loaded",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  return (
    <div className="flex h-screen transition-colors duration-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar as flex sibling */}
      <ChatHistorySidebar
        username={username}
        currentSessionId={sessionId}
        onSessionSelect={loadChatSession}
        onNewChat={startNewChat}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />
      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full h-full relative">
        {/* Hamburger absolutely positioned in top-left when sidebar is closed (mobile/desktop) */}
        {!isSidebarOpen && (
          <Button
            onClick={() => setIsSidebarOpen(true)}
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-[100] rounded-full transition-colors duration-300 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100 shadow md:top-6 md:left-6"
            title="Show sidebar"
            style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        )}
        {/* Header Section */}
        <div className="flex-shrink-0 border-b backdrop-blur-sm transition-colors duration-300 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 w-full relative z-50">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Left: App Logo & Title */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                    Provana KMS
                  </h1>
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm transition-colors duration-300 text-gray-500 dark:text-gray-400">
                      Your Knowledge Management Solution
                    </p>
                    {sessionId && (
                      <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        Session: {sessionId.substring(sessionId.length - 6)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Theme Toggle & User Dropdown */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleDarkMode}
                  variant="ghost"
                  size="icon"
                  className="rounded-full transition-colors duration-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {mounted &&
                    (isDarkMode ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    ))}
                </Button>

                {/* User Info Dropdown */}
                <div className="relative group z-50">
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    tabIndex={0}
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-0.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800">
                        <User className="w-5 h-5 text-blue-500 dark:text-purple-400" />
                      </span>
                    </span>
                    <span className="hidden sm:block max-w-[120px] truncate font-medium text-gray-900 dark:text-gray-100 text-base">
                      {username}
                    </span>
                    <svg
                      className="w-4 h-4 ml-1 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-all z-[9999] border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-0.5">
                        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800">
                          <User className="w-5 h-5 text-blue-500 dark:text-purple-400" />
                        </span>
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Provana User
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("chatbot-username");
                        localStorage.removeItem("current-session-id");
                        window.location.href = "/login";
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-xl transition-colors font-semibold flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-blue-500/70 dark:scrollbar-thumb-blue-900/70 w-full relative z-10">
          <div className="w-full max-w-3-5xl mx-auto space-y-4">
            {isLoadingSession ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-10 w-10 bg-blue-400/30 dark:bg-blue-600/30 rounded-full mb-2"></div>
                  <div className="h-4 w-32 bg-blue-400/30 dark:bg-blue-600/30 rounded"></div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  isHistory={message.isHistory || false}
                />
              ))
            )}

            {isTyping && (
              <div className="flex items-center space-x-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 text-gray-500 dark:text-gray-400">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t backdrop-blur-sm transition-colors duration-300 bg-white/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700 w-full">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-end space-x-3">
              <Button
                onClick={startNewChat}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl transition-colors duration-300 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                title="New Chat"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="pr-12 min-h-[48px] max-h-40 resize-y rounded-xl transition-colors duration-300 border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 w-full py-3 px-4"
                  disabled={isTyping || isLoadingSession}
                  style={{ lineHeight: "1.5", overflow: "auto" }}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping || isLoadingSession}
                className="h-12 w-12 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-left transition-colors duration-300 text-gray-500 dark:text-gray-400">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
                Click the plus icon to start a new chat
              </p>
              <p className="text-xs text-right transition-colors duration-300 text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
