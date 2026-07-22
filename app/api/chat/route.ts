import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    success: true,
    message: {
      role: 'assistant',
      content: 'VoxCommerce Voice AI Assistant is active via Vapi Voice Engine.'
    }
  });
}
