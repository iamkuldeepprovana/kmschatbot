import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { addQueryResponsePairToSession } from '@/lib/models/chat';

// POST /api/chat/message
export async function POST(request: Request) {
  try {
    console.log("Starting MongoDB connection in /api/chat/message");
    await connectToDatabase();
    
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
    
    const { sessionId, user, query, response } = body;
    
    console.log("Received message save request:", { 
      sessionId, 
      user,
      queryPreview: query?.substring(0, 30) + (query?.length > 30 ? '...' : ''),
      responsePreview: response?.substring(0, 30) + (response?.length > 30 ? '...' : '')
    });
    
    // Validate required fields
    if (!sessionId || !user || !query || !response) {
      console.error("Missing required fields:", { 
        hasSessionId: !!sessionId, 
        hasUser: !!user, 
        hasQuery: !!query,
        hasResponse: !!response
      });
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, user, query, and response are required' },
        { status: 400 }
      );
    }
    
    try {
      // Use the helper method to add the query/response pair to the session
      const result = await addQueryResponsePairToSession(
        sessionId, 
        user, 
        query, 
        response
      );
      
      if (!result.success) {
        throw new Error('Failed to add query/response pair to session');
      }
      
      console.log(`${result.isNewSession ? 'Created new' : 'Updated'} chat session: ${sessionId} with new query/response pair`);
      
      return NextResponse.json({ 
        success: true, 
        sessionId: sessionId,
        messageAdded: true,
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
