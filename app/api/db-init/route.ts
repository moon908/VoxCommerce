import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.initSchema();
    return NextResponse.json({
      success: true,
      message: result.message,
      neonConfigured: db.isConfigured
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to initialize database schema.'
      },
      { status: 500 }
    );
  }
}
