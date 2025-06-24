import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Note: We aren't using MongoDB here yet, but initializing the connection
    console.log("Main chat API route called");
    
    const body = await request.json();
    console.log("Received request body:", {
      query: body.query?.substring(0, 30) + '...',
      client_name: body.client_name
    });

    const response = await fetch('https://kmaaivertexai-658439223400.us-central1.run.app/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned status: ${response.status}` },
        { status: response.status }
      );
    }    const data = await response.json();
    console.log("Received API response:", {
      query: data.query?.substring(0, 30) + '...',
      response_length: data.generated_response?.length
    });
    
    // Return the response data
    return NextResponse.json(data);  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
