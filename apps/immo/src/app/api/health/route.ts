import { NextResponse } from 'next/server';

/**
 * Health check endpoint pour Immo App
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'obotcall-immo',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
