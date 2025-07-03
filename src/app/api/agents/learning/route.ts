import { NextRequest, NextResponse } from 'next/server';
import { globalLearningEngine } from '@/lib/agents/learning-engine';
import { globalCollectiveIntelligence } from '@/lib/agents/collective-intelligence';
import { globalPatternRecognition } from '@/lib/agents/pattern-recognition';
import { globalPredictiveIntelligence } from '@/lib/agents/predictive-intelligence';
import { globalKnowledgeRepository } from '@/lib/agents/knowledge-repository';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const agentId = url.searchParams.get('agentId');
    const userId = url.searchParams.get('userId');

    switch (type) {
      case 'patterns':
        const patternInsights = await globalPatternRecognition.getPatternInsights(agentId || undefined);
        return NextResponse.json({
          success: true,
          data: patternInsights
        });

      case 'predictions':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required for predictions' },
            { status: 400 }
          );
        }
        const predictions = await globalPredictiveIntelligence.generatePredictions(
          { timestamp: new Date(), userId },
          ['24h', '7d', '30d']
        );
        return NextResponse.json({
          success: true,
          data: predictions
        });

      case 'collective':
        const collectiveInsights = await globalCollectiveIntelligence.getSystemInsights();
        return NextResponse.json({
          success: true,
          data: collectiveInsights
        });

      case 'knowledge':
        const knowledgeInsights = await globalKnowledgeRepository.getKnowledgeInsights();
        return NextResponse.json({
          success: true,
          data: knowledgeInsights
        });

      case 'learning_report':
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'Agent ID required for learning report' },
            { status: 400 }
          );
        }
        const learningReport = await globalLearningEngine.generateLearningReport(agentId);
        return NextResponse.json({
          success: true,
          data: learningReport
        });

      default:
        // Return comprehensive learning system status
        const [patterns, collective, knowledge] = await Promise.all([
          globalPatternRecognition.getPatternInsights(),
          globalCollectiveIntelligence.getSystemInsights(),
          globalKnowledgeRepository.getKnowledgeInsights()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            patterns,
            collective,
            knowledge,
            timestamp: new Date()
          }
        });
    }
  } catch (error) {
    console.error('Learning API error:', error);
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
      case 'search_knowledge':
        const searchResults = await globalKnowledgeRepository.searchKnowledge(data.query);
        return NextResponse.json({
          success: true,
          data: searchResults
        });

      case 'get_recommendations':
        const recommendations = await globalKnowledgeRepository.getRecommendations(
          data.context,
          data.type,
          data.limit || 10
        );
        return NextResponse.json({
          success: true,
          data: recommendations
        });

      case 'predict_content':
        const contentPrediction = await globalPredictiveIntelligence.predictContentPerformance(
          data.contentType,
          data.topic,
          data.platform,
          data.context
        );
        return NextResponse.json({
          success: true,
          data: contentPrediction
        });

      case 'detect_trends':
        const trendOpportunities = await globalPredictiveIntelligence.detectTrendOpportunities(
          data.industry,
          data.platforms || ['linkedin', 'twitter']
        );
        return NextResponse.json({
          success: true,
          data: trendOpportunities
        });

      case 'share_knowledge':
        await globalCollectiveIntelligence.shareKnowledge(
          data.sourceAgent,
          data.learning,
          data.context
        );
        return NextResponse.json({
          success: true,
          message: 'Knowledge shared successfully'
        });

      case 'request_knowledge':
        const knowledgeResults = await globalCollectiveIntelligence.requestKnowledge(
          data.requestingAgent,
          data.query,
          data.context,
          data.urgency || 'medium'
        );
        return NextResponse.json({
          success: true,
          data: knowledgeResults
        });

      case 'get_opportunities':
        const opportunities = await globalPredictiveIntelligence.getOpportunityAlert(
          data.userId,
          data.urgencyLevel || 'medium'
        );
        return NextResponse.json({
          success: true,
          data: opportunities
        });

      case 'validate_predictions':
        const validation = await globalPredictiveIntelligence.validatePredictions();
        return NextResponse.json({
          success: true,
          data: validation
        });

      case 'store_knowledge':
        const knowledgeId = await globalKnowledgeRepository.storeKnowledge(
          data.content,
          data.type,
          data.category,
          data.metadata
        );
        return NextResponse.json({
          success: true,
          data: { knowledgeId }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Learning API action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}