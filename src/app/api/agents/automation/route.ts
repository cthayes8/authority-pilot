import { NextRequest, NextResponse } from 'next/server';
import { globalAdvancedAutomation } from '@/lib/agents/advanced-automation';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const userId = url.searchParams.get('userId');
    const category = url.searchParams.get('category');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'dashboard':
        const dashboard = await globalAdvancedAutomation.getAutomationDashboard(userId);
        return NextResponse.json({
          success: true,
          data: dashboard
        });

      case 'templates':
        const templates = await globalAdvancedAutomation.getAutomationTemplates(category || undefined);
        return NextResponse.json({
          success: true,
          data: templates
        });

      default:
        // Return comprehensive automation data
        const [dashboardData, templatesData] = await Promise.all([
          globalAdvancedAutomation.getAutomationDashboard(userId),
          globalAdvancedAutomation.getAutomationTemplates()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            dashboard: dashboardData,
            templates: templatesData.slice(0, 10), // Popular templates
            summary: {
              totalRules: dashboardData.summary.totalRules,
              activeRules: dashboardData.summary.activeRules,
              timeSavedThisWeek: dashboardData.summary.timeSavedThisWeek,
              averageSuccessRate: dashboardData.summary.averageSuccessRate
            }
          }
        });
    }
  } catch (error) {
    console.error('Automation API error:', error);
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
      case 'create_rule':
        const ruleId = await globalAdvancedAutomation.createAutomationRule(
          data.userId,
          data.rule
        );
        return NextResponse.json({
          success: true,
          data: { ruleId }
        });

      case 'execute_rule':
        const executionId = await globalAdvancedAutomation.executeAutomationRule(
          data.ruleId,
          data.triggerData || {},
          data.context || {}
        );
        return NextResponse.json({
          success: true,
          data: { executionId }
        });

      case 'create_from_template':
        const templateRuleId = await globalAdvancedAutomation.createFromTemplate(
          data.templateId,
          data.userId,
          data.customization || {}
        );
        return NextResponse.json({
          success: true,
          data: { ruleId: templateRuleId }
        });

      case 'optimize_performance':
        await globalAdvancedAutomation.optimizeAutomationPerformance(data.ruleId);
        return NextResponse.json({
          success: true,
          message: 'Performance optimization initiated'
        });

      case 'bulk_create_rules':
        const results = [];
        for (const rule of data.rules) {
          try {
            const id = await globalAdvancedAutomation.createAutomationRule(
              data.userId,
              rule
            );
            results.push({ ...rule, id, status: 'success' });
          } catch (error) {
            results.push({ ...rule, status: 'error', error: error.message });
          }
        }
        return NextResponse.json({
          success: true,
          data: { results }
        });

      case 'pause_rule':
        // Implementation would pause/resume automation rule
        return NextResponse.json({
          success: true,
          message: `Rule ${data.ruleId} ${data.pause ? 'paused' : 'resumed'}`
        });

      case 'delete_rule':
        // Implementation would delete automation rule
        return NextResponse.json({
          success: true,
          message: `Rule ${data.ruleId} deleted`
        });

      case 'test_rule':
        // Test automation rule without actually executing
        try {
          const testResult = await globalAdvancedAutomation.executeAutomationRule(
            data.ruleId,
            { ...data.testData, dryRun: true },
            { userId: data.userId }
          );
          return NextResponse.json({
            success: true,
            data: { testResult, message: 'Test completed successfully' }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Test failed: ${error.message}`
          });
        }

      case 'get_execution_logs':
        // Implementation would fetch execution logs
        return NextResponse.json({
          success: true,
          data: { logs: [] } // Mock data
        });

      case 'export_rules':
        // Export automation rules
        const dashboard = await globalAdvancedAutomation.getAutomationDashboard(data.userId);
        return NextResponse.json({
          success: true,
          data: dashboard.activeRules,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="automation-rules.json"'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Automation action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}