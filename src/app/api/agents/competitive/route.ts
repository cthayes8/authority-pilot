import { NextRequest, NextResponse } from 'next/server';
import { globalCompetitiveIntelligence } from '@/lib/agents/competitive-intelligence';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const competitorId = url.searchParams.get('competitorId');
    const industry = url.searchParams.get('industry');
    const severity = url.searchParams.get('severity') as 'info' | 'warning' | 'urgent';

    switch (type) {
      case 'threats':
        const threats = await globalCompetitiveIntelligence.detectCompetitiveThreats(competitorId || undefined);
        return NextResponse.json({
          success: true,
          data: threats
        });

      case 'opportunities':
        const opportunities = await globalCompetitiveIntelligence.identifyCompetitiveOpportunities(
          industry || undefined
        );
        return NextResponse.json({
          success: true,
          data: opportunities
        });

      case 'alerts':
        const alerts = await globalCompetitiveIntelligence.getCompetitiveAlerts(severity || 'warning');
        return NextResponse.json({
          success: true,
          data: alerts
        });

      case 'insights':
        if (!competitorId) {
          return NextResponse.json(
            { success: false, error: 'Competitor ID required for insights' },
            { status: 400 }
          );
        }
        const insights = await globalCompetitiveIntelligence.getCompetitorInsights(competitorId);
        return NextResponse.json({
          success: true,
          data: insights
        });

      case 'market':
        if (!industry) {
          return NextResponse.json(
            { success: false, error: 'Industry required for market intelligence' },
            { status: 400 }
          );
        }
        const marketIntel = await globalCompetitiveIntelligence.getMarketIntelligence(industry);
        return NextResponse.json({
          success: true,
          data: marketIntel
        });

      case 'report':
        const reportType = url.searchParams.get('reportType') as 'summary' | 'detailed' | 'strategic';
        const report = await globalCompetitiveIntelligence.generateCompetitiveReport(
          competitorId || undefined,
          reportType || 'summary'
        );
        return NextResponse.json({
          success: true,
          data: report
        });

      default:
        // Return competitive intelligence dashboard data
        const [threatsData, opportunitiesData, alertsData] = await Promise.all([
          globalCompetitiveIntelligence.detectCompetitiveThreats(),
          globalCompetitiveIntelligence.identifyCompetitiveOpportunities(),
          globalCompetitiveIntelligence.getCompetitiveAlerts('warning')
        ]);

        return NextResponse.json({
          success: true,
          data: {
            threats: threatsData.slice(0, 10), // Top 10 threats
            opportunities: opportunitiesData.slice(0, 10), // Top 10 opportunities
            alerts: alertsData.slice(0, 5), // Recent alerts
            summary: {
              totalThreats: threatsData.length,
              criticalThreats: threatsData.filter(t => t.severity === 'critical').length,
              totalOpportunities: opportunitiesData.length,
              highValueOpportunities: opportunitiesData.filter(o => o.value === 'high' || o.value === 'transformational').length,
              activeAlerts: alertsData.length
            }
          }
        });
    }
  } catch (error) {
    console.error('Competitive intelligence API error:', error);
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
      case 'add_competitor':
        const competitorId = await globalCompetitiveIntelligence.addCompetitor(
          data.name,
          data.domain,
          data.industry,
          data.tier || 'direct'
        );
        return NextResponse.json({
          success: true,
          data: { competitorId }
        });

      case 'analyze_landscape':
        const landscapeAnalysis = await globalCompetitiveIntelligence.analyzeCompetitiveLandscape(
          data.industry,
          data.focusArea
        );
        return NextResponse.json({
          success: true,
          data: landscapeAnalysis
        });

      case 'detect_threats':
        const threatsAnalysis = await globalCompetitiveIntelligence.detectCompetitiveThreats(
          data.competitorId
        );
        return NextResponse.json({
          success: true,
          data: threatsAnalysis
        });

      case 'identify_opportunities':
        const opportunitiesAnalysis = await globalCompetitiveIntelligence.identifyCompetitiveOpportunities(
          data.industry,
          data.timeframe || '6_months'
        );
        return NextResponse.json({
          success: true,
          data: opportunitiesAnalysis
        });

      case 'generate_report':
        const reportData = await globalCompetitiveIntelligence.generateCompetitiveReport(
          data.competitorId,
          data.reportType || 'summary'
        );
        return NextResponse.json({
          success: true,
          data: reportData
        });

      case 'bulk_add_competitors':
        const results = [];
        for (const competitor of data.competitors) {
          try {
            const id = await globalCompetitiveIntelligence.addCompetitor(
              competitor.name,
              competitor.domain,
              competitor.industry,
              competitor.tier
            );
            results.push({ ...competitor, id, status: 'success' });
          } catch (error) {
            results.push({ ...competitor, status: 'error', error: error.message });
          }
        }
        return NextResponse.json({
          success: true,
          data: { results }
        });

      case 'export_intelligence':
        // Export competitive intelligence data
        const exportData = await globalCompetitiveIntelligence.generateCompetitiveReport(
          undefined,
          'detailed'
        );
        return NextResponse.json({
          success: true,
          data: exportData,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="competitive-intelligence-report.json"'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Competitive intelligence action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}