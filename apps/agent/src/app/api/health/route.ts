import { NextResponse } from 'next/server';

/**
 * Health check endpoint pour Agent App
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'obotcall-agent',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
