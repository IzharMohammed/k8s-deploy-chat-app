import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrlEnv = process.env.BACKEND_URL || 'http://backend-service:4000/api/chat';

    // Resolve chatsUrl robustly based on how BACKEND_URL is formatted
    let chatsUrl = backendUrlEnv;
    if (chatsUrl.endsWith('/api/chat')) {
      chatsUrl = chatsUrl.replace('/api/chat', '/api/chats');
    } else if (chatsUrl.endsWith('/chat')) {
      chatsUrl = chatsUrl.replace('/chat', '/chats');
    } else {
      chatsUrl = chatsUrl.replace(/\/$/, '') + '/api/chats';
    }

    const response = await fetch(chatsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in chats API route:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
