import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getChatSessionsByUsername } from '@/lib/models/chat';
import { getConnectionStateString } from '@/lib/mongodb';

// GET /api/chat/history
export async function GET(request: Request) {
  try {
    console.log("Starting MongoDB connection in /api/chat/history");
    
    // Try to connect to MongoDB with better error handling
    let mongoose;
    try {
      mongoose = await connectToDatabase();
      const connectionState = mongoose.connection.readyState;
      console.log("MongoDB connection state:", getConnectionStateString(connectionState));
      
      if (connectionState !== 1) {
        throw new Error(`MongoDB not connected. Current state: ${getConnectionStateString(connectionState)}`);
      }
    } catch (dbError) {
      console.error("MongoDB connection error in history endpoint:", dbError);
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
    
    // Extract query parameters
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    console.log("Fetching chat history for username:", username);
    
    if (!username) {
      console.error("Username parameter is missing");
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
      
    // Fetch chat history for the user using our helper method
    try {
      const chatSessions = await getChatSessionsByUsername(username);
      console.log(`Found ${chatSessions.length} chat sessions for ${username}`);
      
      return NextResponse.json({ chatSessions });
    } catch (queryError) {
      console.error('Error querying chat sessions:', queryError);
      return NextResponse.json(
        { 
          error: 'Database query error', 
          message: queryError instanceof Error ? queryError.message : 'Unknown query error'
        },
        { status: 500 }
      );
    }  } catch (error) {
    // Add detailed error information to help debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      connectionState: mongoose && 'connection' in mongoose ? 
        getConnectionStateString((mongoose as any).connection.readyState) : 'unknown'
    };
    
    console.error('Chat History API Error:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        ...errorDetails
      },
      { status: 500 }
    );
  }
}
