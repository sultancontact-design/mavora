/**
 * API Route: Real-time Notification Stream (SSE)
 * Endpoint: GET /api/notifications/stream
 * 
 * This endpoint provides Server-Sent Events for real-time notifications
 */

import { NextRequest } from 'next/server';
import { notificationManager } from '@/lib/realtime-notifications';
import { getServerSession } from '@/lib/auth';

export const runtime = 'edge'; // Edge runtime for better SSE support
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get user session
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = session.user.id;

  // Create SSE stream
  const stream = notificationManager.subscribe(userId);

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}
