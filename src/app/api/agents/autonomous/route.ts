import { NextRequest, NextResponse } from 'next/server';
import { globalScheduler } from '@/lib/agents/autonomous-scheduler';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const status = globalScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get autonomous status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();

    switch (action) {
      case 'start':
        await globalScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Autonomous operations started'
        });

      case 'stop':
        await globalScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Autonomous operations stopped'
        });

      case 'optimize':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required for optimization' },
            { status: 400 }
          );
        }
        await globalScheduler.optimizeForUser(userId);
        return NextResponse.json({
          success: true,
          message: `Optimized for user ${userId}`
        });

      case 'initialize':
        await globalScheduler.initialize();
        return NextResponse.json({
          success: true,
          message: 'Scheduler initialized'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Autonomous API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}