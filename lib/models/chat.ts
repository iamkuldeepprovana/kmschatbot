import mongoose, { Schema, Document } from 'mongoose';

// Message pair interface and schema
export interface IMessagePair {
  query: string;
  response: string;
}

// Chat session interface and schema
export interface IChatSession extends Document {
  sessionId: string;    // Unique identifier for the chat session
  user: string;         // The user who owns this chat session
  title: string;        // Title generated from the first query
  messages: IMessagePair[]; // Array of {query, response} pairs
  createdAt: Date;
}

const MessagePairSchema = new Schema<IMessagePair>({
  query: { type: String, required: true },
  response: { type: String, required: true }
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  user: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [MessagePairSchema],
  createdAt: { type: Date, default: Date.now }
});

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

// Helper to add a query/response pair to a session
export async function addQueryResponsePairToSession(sessionId: string, user: string, query: string, response: string) {
  try {
    let session = await ChatSession.findOne({ sessionId });
    if (session) {
      session.messages.push({ query, response });
      await session.save();
      return { success: true, sessionId, isNewSession: false };
    } else {
      // Generate title from the first query (first 50 characters)
      const title = query.length > 50 ? query.substring(0, 50) + '...' : query;
      
      await ChatSession.create({
        sessionId,
        user,
        title,
        messages: [{ query, response }],
        createdAt: new Date()
      });
      return { success: true, sessionId, isNewSession: true };
    }
  } catch (error) {
    console.error('Error adding query/response pair to session:', error);
    return { success: false, error };
  }
}

// Helper to get all chat sessions for a user
export async function getChatSessionsByUsername(user: string) {
  try {
    if (!user) {
      console.error('getChatSessionsByUsername called with empty user');
      return [];
    }
    const sessions = await ChatSession.find({ user })
      .sort({ createdAt: -1 })
      .select('sessionId title createdAt messages')
      .lean();
    
    // Transform sessions to include updatedAt for compatibility
    const transformedSessions = sessions.map(session => ({
      ...session,
      updatedAt: session.createdAt // Use createdAt as updatedAt for now
    }));
    
    return transformedSessions;
  } catch (error) {
    console.error('Error fetching chat sessions by user:', error);
    return [];
  }
}

export const ChatSession = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
