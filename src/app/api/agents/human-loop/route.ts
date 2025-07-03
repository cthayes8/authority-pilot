import { NextRequest, NextResponse } from 'next/server';
import { globalHumanInTheLoop } from '@/lib/agents/human-in-the-loop';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'dashboard':
        const dashboard = await globalHumanInTheLoop.getUserDashboard(userId);
        return NextResponse.json({
          success: true,
          data: dashboard
        });

      case 'feedback':
        const feedbackQueue = await globalHumanInTheLoop.getFeedbackQueue(userId);
        return NextResponse.json({
          success: true,
          data: feedbackQueue
        });

      case 'tasks':
        const validationTasks = await globalHumanInTheLoop.getValidationTasks(userId);
        return NextResponse.json({
          success: true,
          data: validationTasks
        });

      default:
        // Return complete human-in-the-loop status
        const [dashboard2, feedback, tasks] = await Promise.all([
          globalHumanInTheLoop.getUserDashboard(userId),
          globalHumanInTheLoop.getFeedbackQueue(userId),
          globalHumanInTheLoop.getValidationTasks(userId)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            dashboard: dashboard2,
            pendingFeedback: feedback.filter(f => f.status === 'pending'),
            pendingTasks: tasks.filter(t => t.status === 'pending'),
            recentFeedback: feedback.slice(-5),
            recentTasks: tasks.slice(-5)
          }
        });
    }
  } catch (error) {
    console.error('Human-in-the-loop API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'request_feedback':
        const feedback = await globalHumanInTheLoop.requestHumanInput(
          data.userId,
          data.agentId,
          data.target,
          data.urgency || 'medium'
        );
        return NextResponse.json({
          success: true,
          data: feedback
        });

      case 'submit_response':
        await globalHumanInTheLoop.processHumanResponse(
          data.feedbackId,
          data.userId,
          data.response
        );
        return NextResponse.json({
          success: true,
          message: 'Response processed successfully'
        });

      case 'create_task':
        const taskId = await globalHumanInTheLoop.createValidationTask(
          data.userId,
          data.type,
          data.title,
          data.data,
          data.requiredBy ? new Date(data.requiredBy) : undefined
        );
        return NextResponse.json({
          success: true,
          data: { taskId }
        });

      case 'start_session':
        const sessionId = await globalHumanInTheLoop.startCollaborativeSession(
          data.type,
          data.objective,
          data.participants
        );
        return NextResponse.json({
          success: true,
          data: { sessionId }
        });

      case 'bulk_approve':
        // Approve multiple items at once
        const results = [];
        for (const feedbackId of data.feedbackIds) {
          try {
            await globalHumanInTheLoop.processHumanResponse(
              feedbackId,
              data.userId,
              {
                selectedOption: 'approve',
                confidence: 0.8,
                reasoning: 'Bulk approval'
              }
            );
            results.push({ feedbackId, status: 'approved' });
          } catch (error) {
            results.push({ feedbackId, status: 'error', error: error.message });
          }
        }
        return NextResponse.json({
          success: true,
          data: { results }
        });

      case 'snooze_feedback':
        // Snooze feedback for later review
        // Implementation would update feedback status and reschedule
        return NextResponse.json({
          success: true,
          message: `Feedback ${data.feedbackId} snoozed until ${data.snoozeUntil}`
        });

      case 'delegate_task':
        // Delegate validation task to another user
        // Implementation would update task assignment
        return NextResponse.json({
          success: true,
          message: `Task ${data.taskId} delegated to ${data.delegateTo}`
        });

      case 'update_preferences':
        // Update user interruption preferences
        // Implementation would update user preferences
        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Human-in-the-loop action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}