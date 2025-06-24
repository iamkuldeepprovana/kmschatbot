import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getChatSessionById } from '@/lib/models/chat';
import { ChatSession } from '@/lib/models/chat';

// GET /api/chat/:sessionId
export async function GET(
  request: Request,
  context: { params: { sessionId: string } }
) {
  try {
    console.log("Starting MongoDB connection in /api/chat/[sessionId] GET");
    const mongoose = await connectToDatabase();
    console.log("MongoDB connection successful:", mongoose.connection.readyState === 1);
    
    const { sessionId } = await context.params;
    console.log("Fetching chat session with ID:", sessionId);
    
    if (!sessionId) {
      console.error("Session ID parameter is missing");
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Use the helper method to get chat session by ID
    const chatSession = await getChatSessionById(sessionId);
    
    if (!chatSession) {
      console.log(`Chat session not found: ${sessionId}`);
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found chat session: ${sessionId} with ${(chatSession as any).messages?.length || 0} messages`);
    return NextResponse.json({ chatSession });
  } catch (error) {
    console.error('Get Chat Session API Error:', error);
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

// DELETE /api/chat/:sessionId
export async function DELETE(
  request: Request,
  context: { params: { sessionId: string } }
) {
  try {
    console.log("Starting MongoDB connection in /api/chat/[sessionId] DELETE");
    const mongoose = await connectToDatabase();
    console.log("MongoDB connection successful:", mongoose.connection.readyState === 1);
    
    const { sessionId } = await context.params;
    console.log("Deleting chat session with ID:", sessionId);
    
    if (!sessionId) {
      console.error("Session ID parameter is missing");
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
      const result = await ChatSession.deleteOne({ sessionId });
    console.log(`Delete result:`, result);
    
    if (result.deletedCount === 0) {
      console.log(`No chat session found to delete with ID: ${sessionId}`);
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    console.log(`Successfully deleted chat session: ${sessionId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Chat Session API Error:', error);
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
