import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { addMessageToSession } from '@/lib/models/chat';
import { getConnectionStateString } from '@/lib/mongodb';

// POST /api/chat/message
export async function POST(request: Request) {
  try {
    console.log("Starting MongoDB connection in /api/chat/message");
    
    // Try to connect to MongoDB
    const mongoose = await connectToDatabase();
    const connectionState = mongoose.connection.readyState;
    
    console.log("MongoDB connection state:", getConnectionStateString(connectionState));
    
    // Verify the connection is established
    if (connectionState !== 1) {
      console.error("MongoDB not connected. Current state:", getConnectionStateString(connectionState));
      return NextResponse.json(
        { 
          error: 'Database connection not established', 
          connectionState: getConnectionStateString(connectionState)
        },
        { status: 500 }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { sessionId, role, content, username = 'guest' } = body;
    
    console.log("Received message save request:", { 
      sessionId, 
      role,
      contentPreview: content?.substring(0, 30) + (content?.length > 30 ? '...' : '')
    });
    
    // Validate required fields
    if (!sessionId || !role || !content) {
      console.error("Missing required fields:", { 
        hasSessionId: !!sessionId, 
        hasRole: !!role, 
        hasContent: !!content
      });
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, role, and content are required' },
        { status: 400 }
      );
    }
    
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Role must be either "user" or "assistant"' },
        { status: 400 }
      );
    }
    
    try {
      // Use the helper method to add the message to the session
      const result = await addMessageToSession(
        sessionId, 
        content, 
        role as 'user' | 'assistant', 
        username
      );
      
      if (!result.success) {
        throw new Error('Failed to add message to session');
      }
      
      console.log(`${result.isNewSession ? 'Created new' : 'Updated'} chat session: ${sessionId} with new message`);
      
      return NextResponse.json({ 
        success: true, 
        sessionId: sessionId,
        messageAdded: true,
        isUser: role === 'user',
        isNewSession: result.isNewSession
      });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        { 
          error: 'Database operation failed', 
          message: dbError instanceof Error ? dbError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Message Save API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
