import mongoose, { Schema, Document } from 'mongoose';

// Message interface and schema
export interface IMessage extends Document {
  content: string;   // The message content (user question or AI response)
  isUser: boolean;   // True for user messages, false for AI responses
  role?: string;     // 'user' or 'assistant' - for compatibility with OpenAI format
  timestamp: Date;   // When the message was sent
}

const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  isUser: { type: Boolean, required: true, default: false },
  role: { type: String, enum: ['user', 'assistant'], required: false },
  timestamp: { type: Date, required: true, default: Date.now }
});

// Chat session interface and schema
export interface IChatSession extends Document {
  sessionId: string;    // Unique identifier for the chat session
  username: string;     // The user who owns this chat session
  title: string;        // Title derived from the first user message
  messages: IMessage[]; // Array of messages (both user and AI)
  createdAt: Date;      // When the session was created
  updatedAt: Date;      // When the session was last updated
}

const ChatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Helper methods
export async function getChatSessionsByUsername(username: string) {
  try {
    if (!username) {
      console.error('getChatSessionsByUsername called with empty username');
      return [];
    }
    
    console.log(`Fetching chat sessions for username: ${username}`);
    
    // Check if the model is registered
    if (!mongoose.models.ChatSession) {
      console.error('ChatSession model is not registered');
      return [];
    }
    
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error(`MongoDB not connected. Current state: ${mongoose.connection.readyState}`);
      return [];
    }
    
    const sessions = await ChatSession.find({ username })
      .sort({ updatedAt: -1 })
      .select('sessionId title createdAt updatedAt')
      .lean();
      
    console.log(`Found ${sessions.length} sessions for user ${username}`);
    return sessions;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

// Helper to get a chat session with all messages by sessionId
export async function getChatSessionById(sessionId: string) {
  try {
    const session = await ChatSession.findOne({ sessionId }).lean();
    return session;
  } catch (error) {
    console.error('Error fetching chat session by ID:', error);
    return null;
  }
}

// Helper to add a message to a session
export async function addMessageToSession(sessionId: string, content: string, role: 'user' | 'assistant', username: string) {
  try {
    // Skip saving hardcoded welcome messages to prevent unnecessary DB operations
    const WELCOME_MESSAGE = 'Welcome to Provana KMS! How can I help you today?';
    const isWelcomeMessage =
      !role ||
      (role === 'assistant' &&
        (content === WELCOME_MESSAGE || content.startsWith('Welcome to Provana KMS')));
    if (isWelcomeMessage) {
      console.log('Skipping welcome message - not saving to database');
      return { success: true, sessionId, isNewSession: false, skipped: true };
    }

    const isUser = role === 'user';
    const message = {
      content,
      isUser,
      role,
      timestamp: new Date()
    };

    // Try to find an existing session
    let session = await ChatSession.findOne({ sessionId });
    
    if (session) {
      // Update existing session
      session.messages.push(message);
      session.updatedAt = new Date();
      
      // If this is the first user message and the current title is generic, update it
      if (isUser && (session.title === 'New Chat' || session.title.startsWith('Welcome to Provana KMS'))) {
        session.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      }
      
      await session.save();
      return { success: true, sessionId, isNewSession: false };
    } else {
      // Create new session with this message as the first message
      // Only create session when we have a real user message or AI response (not welcome message)
      const title = isUser ? 
        (content.substring(0, 50) + (content.length > 50 ? '...' : '')) : 
        'New Chat';
        
      await ChatSession.create({
        sessionId,
        username,
        title,
        messages: [message],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, sessionId, isNewSession: true };
    }
  } catch (error) {
    console.error('Error adding message to session:', error);
    return { success: false, error };
  }
}

// Create and export models
export const ChatSession = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
