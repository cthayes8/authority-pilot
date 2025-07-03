/**
 * News Intelligence Agent v1.0
 * 
 * Role Definition:
 * You are the News Intelligence specialist responsible for real-time news monitoring, trend detection, 
 * industry analysis, and providing current event context for content generation.
 * 
 * Primary Objective:
 * Your main task is to continuously monitor news sources, identify relevant trends and breaking news, 
 * analyze industry developments, and provide fresh context for content creation that keeps users ahead 
 * of their competition.
 */

import { BaseAgent } from './base-agent';
import { 
  Context, 
  Observation, 
  Thought, 
  Plan, 
  Action, 
  Result, 
  Learning 
} from './types';
import { globalNewsIntelligence, NewsArticle, SearchQuery, TrendData } from '@/lib/external-apis/news-sources';
import { globalToolRegistry } from './tools';
import { openai } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

interface NewsMonitoringConfig {
  userId: string;
  industry: string;
  keywords: string[];
  competitors: string[];
  updateFrequency: number; // minutes
  priorities: NewsPriority[];
  filters: NewsFilter[];
}

interface NewsPriority {
  keyword: string;
  weight: number; // 0-1
  category: 'industry' | 'competitor' | 'trend' | 'technology' | 'regulation';
}

interface NewsFilter {
  type: 'include' | 'exclude';
  criteria: 'keyword' | 'source' | 'sentiment' | 'age';
  value: string | number;
}

interface NewsInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'threat' | 'update' | 'breakthrough';
  headline: string;
  summary: string;
  relevanceScore: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  sources: string[];
  relatedArticles: NewsArticle[];
  contentOpportunities: ContentOpportunity[];
  timestamp: Date;
}

interface ContentOpportunity {
  type: 'reaction_post' | 'analysis_article' | 'trend_commentary' | 'expert_take';
  angle: string;
  suggestedContent: string;
  timeliness: 'immediate' | 'within_hours' | 'within_days';
  competitiveAdvantage: string;
}

interface IndustryAnalysis {
  industry: string;
  timeframe: string;
  keyDevelopments: NewsInsight[];
  emergingTrends: TrendData[];
  competitiveMovements: CompetitorActivity[];
  marketSentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}

interface CompetitorActivity {
  competitor: string;
  activity: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  implications: string[];
  responseRecommendations: string[];
}

export class NewsIntelligenceAgent extends BaseAgent {
  private monitoringConfigs: Map<string, NewsMonitoringConfig> = new Map();
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private insightsCache: Map<string, NewsInsight[]> = new Map();
  private industryAnalyses: Map<string, IndustryAnalysis> = new Map();
  private lastUpdate: Map<string, Date> = new Map();

  constructor() {
    super({
      id: 'news_intelligence_agent',
      name: 'News Intelligence Specialist',
      role: 'Real-time news monitoring, trend detection, and industry analysis for content intelligence',
      capabilities: [
        'news_monitoring',
        'trend_detection',
        'industry_analysis',
        'competitor_tracking',
        'content_opportunity_identification',
        'breaking_news_alerts',
        'sentiment_analysis',
        'news_synthesis'
      ],
      tools: [
        globalToolRegistry.getTool('web_research'),
        globalToolRegistry.getTool('analytics')
      ].filter(Boolean)
    });

    this.startContinuousMonitoring();
  }

  // Core cognitive methods
  async perceive(context: Context): Promise<Observation[]> {
    const observations: Observation[] = [];
    
    try {
      console.log('🔍 News Intelligence Agent perceiving current information landscape...');

      // Monitor breaking news
      const breakingNews = await this.monitorBreakingNews(context);
      observations.push(...breakingNews);

      // Track industry developments
      const industryNews = await this.trackIndustryDevelopments(context);
      observations.push(...industryNews);

      // Monitor competitor activities
      const competitorNews = await this.monitorCompetitorActivities(context);
      observations.push(...competitorNews);

      // Detect emerging trends
      const trendingTopics = await this.detectEmergingTrends(context);
      observations.push(...trendingTopics);

      console.log(`📊 Perceived ${observations.length} news and trend observations`);
      return observations;

    } catch (error) {
      console.error('News perception failed:', error);
      return [];
    }
  }

  async think(observations: Observation[]): Promise<Thought[]> {
    const thoughts: Thought[] = [];

    try {
      console.log('🧠 Analyzing news patterns and implications...');

      // Analyze news significance
      for (const observation of observations) {
        if (observation.type === 'news_development') {
          const significance = await this.analyzeNewsSignificance(observation);
          thoughts.push({
            id: `news_analysis_${Date.now()}`,
            type: 'analysis',
            content: `News significance analysis: ${significance.summary}`,
            confidence: significance.confidence,
            reasoning: significance.reasoning,
            relatedObservations: [observation.id],
            metadata: { significance: significance.level }
          });
        }
      }

      // Identify content opportunities
      const contentOpps = await this.identifyContentOpportunities(observations);
      thoughts.push(...contentOpps);

      // Analyze competitive implications
      const competitiveThoughts = await this.analyzeCompetitiveImplications(observations);
      thoughts.push(...competitiveThoughts);

      console.log(`💭 Generated ${thoughts.length} strategic thoughts from news analysis`);
      return thoughts;

    } catch (error) {
      console.error('News thinking failed:', error);
      return [];
    }
  }

  async plan(thoughts: Thought[]): Promise<Plan> {
    try {
      console.log('📋 Planning news intelligence actions...');

      const actions: Action[] = [];

      // Plan immediate content opportunities
      const urgentOpportunities = thoughts.filter(t => 
        t.metadata?.urgency === 'high' || t.metadata?.urgency === 'critical'
      );

      for (const opportunity of urgentOpportunities) {
        actions.push({
          id: `news_action_${Date.now()}_${Math.random()}`,
          type: 'create_news_content',
          priority: opportunity.metadata?.urgency === 'critical' ? 'critical' : 'high',
          parameters: {
            opportunity: opportunity.content,
            reasoning: opportunity.reasoning,
            timeframe: 'immediate'
          },
          expectedOutcome: 'Timely content leveraging breaking news',
          dependencies: [],
          estimatedDuration: 15
        });
      }

      // Plan industry analysis updates
      const industryAnalysisNeeded = thoughts.filter(t => 
        t.type === 'analysis' && t.metadata?.requiresIndustryUpdate
      );

      if (industryAnalysisNeeded.length > 0) {
        actions.push({
          id: `industry_analysis_${Date.now()}`,
          type: 'update_industry_analysis',
          priority: 'medium',
          parameters: {
            industries: industryAnalysisNeeded.map(t => t.metadata?.industry).filter(Boolean),
            focus: 'comprehensive_update'
          },
          expectedOutcome: 'Updated industry intelligence',
          dependencies: [],
          estimatedDuration: 30
        });
      }

      return {
        id: `news_plan_${Date.now()}`,
        actions,
        reasoning: 'Prioritizing time-sensitive news opportunities and industry intelligence updates',
        expectedOutcomes: [
          'Real-time content leveraging current events',
          'Updated industry analysis and competitive intelligence',
          'Enhanced content strategy based on emerging trends'
        ],
        priority: actions.some(a => a.priority === 'critical') ? 'critical' : 'high',
        estimatedDuration: Math.max(...actions.map(a => a.estimatedDuration))
      };

    } catch (error) {
      console.error('News planning failed:', error);
      return { id: 'empty_plan', actions: [], reasoning: 'Planning failed', expectedOutcomes: [], priority: 'low', estimatedDuration: 0 };
    }
  }

  // News Intelligence Methods

  async monitorIndustryNews(industry: string, keywords: string[] = []): Promise<NewsInsight[]> {
    console.log(`📰 Monitoring ${industry} industry news...`);

    try {
      // Get industry-specific news
      const industryNews = await globalNewsIntelligence.getIndustryNews(industry, 20);
      
      // Add keyword-specific news
      const keywordNews = await Promise.all(
        keywords.map(keyword => 
          globalNewsIntelligence.searchAllSources({
            query: `${keyword} ${industry}`,
            pageSize: 10,
            from: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          })
        )
      );

      const allNews = [...industryNews, ...keywordNews.flat()];
      
      // Analyze and convert to insights
      const insights = await this.convertNewsToInsights(allNews, industry);
      
      // Cache results
      this.insightsCache.set(`${industry}_insights`, insights);
      this.lastUpdate.set(industry, new Date());

      return insights;

    } catch (error) {
      console.error(`Industry news monitoring failed for ${industry}:`, error);
      return [];
    }
  }

  async getBreakingNewsAlerts(industry?: string): Promise<NewsInsight[]> {
    console.log('🚨 Checking for breaking news alerts...');

    try {
      // Get very recent news (last 2 hours)
      const searchQuery: SearchQuery = {
        query: industry ? `${industry} breaking news` : 'breaking news',
        pageSize: 15,
        sortBy: 'publishedAt',
        from: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
      };

      const breakingNews = await globalNewsIntelligence.searchAllSources(searchQuery);
      
      // Filter for truly breaking news (high velocity, high interest)
      const breakingInsights = await this.identifyBreakingNews(breakingNews);
      
      return breakingInsights.filter(insight => insight.urgency === 'high' || insight.urgency === 'critical');

    } catch (error) {
      console.error('Breaking news monitoring failed:', error);
      return [];
    }
  }

  async analyzeTrendOpportunities(industry: string): Promise<ContentOpportunity[]> {
    console.log(`📈 Analyzing trend opportunities for ${industry}...`);

    try {
      // Get trending topics
      const trends = await globalNewsIntelligence.getTrendingTopics();
      
      // Filter trends relevant to industry
      const relevantTrends = trends.filter(trend => 
        trend.keyword.toLowerCase().includes(industry.toLowerCase()) ||
        trend.relatedQueries.some(q => q.toLowerCase().includes(industry.toLowerCase()))
      );

      const opportunities: ContentOpportunity[] = [];

      for (const trend of relevantTrends) {
        // Analyze each trend for content opportunities
        const trendOpportunities = await this.analyzeTrendForContent(trend, industry);
        opportunities.push(...trendOpportunities);
      }

      return opportunities.sort((a, b) => {
        const urgencyScore = { immediate: 3, within_hours: 2, within_days: 1 };
        return urgencyScore[b.timeliness] - urgencyScore[a.timeliness];
      });

    } catch (error) {
      console.error('Trend analysis failed:', error);
      return [];
    }
  }

  async generateIndustryReport(industry: string, timeframe: string = '7d'): Promise<IndustryAnalysis> {
    console.log(`📊 Generating ${industry} industry report for ${timeframe}...`);

    try {
      // Get comprehensive industry news
      const industryNews = await globalNewsIntelligence.getIndustryNews(industry, 50);
      
      // Get trending topics
      const trends = await globalNewsIntelligence.getTrendingTopics();
      
      // Analyze sentiment
      const newsWithSentiment = await globalNewsIntelligence.analyzeNewsSentiment(industryNews);
      
      // Generate insights
      const insights = await this.convertNewsToInsights(newsWithSentiment, industry);
      
      // Calculate market sentiment
      const marketSentiment = this.calculateMarketSentiment(newsWithSentiment);
      
      // Identify opportunities and risks
      const opportunities = await this.identifyMarketOpportunities(insights);
      const risks = await this.identifyMarketRisks(insights);
      
      // Generate recommendations
      const recommendations = await this.generateStrategicRecommendations(insights, opportunities, risks);

      const analysis: IndustryAnalysis = {
        industry,
        timeframe,
        keyDevelopments: insights.slice(0, 10),
        emergingTrends: trends.slice(0, 5),
        competitiveMovements: await this.analyzeCompetitorMovements(industryNews),
        marketSentiment,
        opportunities,
        risks,
        recommendations
      };

      // Cache the analysis
      this.industryAnalyses.set(industry, analysis);
      
      return analysis;

    } catch (error) {
      console.error(`Industry report generation failed for ${industry}:`, error);
      throw error;
    }
  }

  // Helper Methods

  private async convertNewsToInsights(news: NewsArticle[], industry: string): Promise<NewsInsight[]> {
    const insights: NewsInsight[] = [];

    for (const article of news.slice(0, 15)) { // Limit to prevent API overuse
      try {
        const insight = await this.analyzeArticleForInsights(article, industry);
        if (insight) {
          insights.push(insight);
        }
      } catch (error) {
        console.error('Article analysis failed:', error);
      }
    }

    return insights.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async analyzeArticleForInsights(article: NewsArticle, industry: string): Promise<NewsInsight | null> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `# News Analysis Specialist

## Role
You are an expert news analyst specializing in identifying business insights and content opportunities from news articles.

## Task
Analyze the provided news article and determine its significance for the ${industry} industry.

## Output Format
Respond with a JSON object containing:
{
  "type": "trend|opportunity|threat|update|breakthrough",
  "headline": "Key insight headline",
  "summary": "2-3 sentence summary",
  "relevanceScore": 0.0-1.0,
  "urgency": "low|medium|high|critical",
  "contentOpportunities": [
    {
      "type": "reaction_post|analysis_article|trend_commentary|expert_take",
      "angle": "Content angle description",
      "timeliness": "immediate|within_hours|within_days"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}
Published: ${article.publishedAt.toISOString()}
Industry Context: ${industry}`
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        id: `insight_${article.id}`,
        type: analysis.type || 'update',
        headline: analysis.headline || article.title,
        summary: analysis.summary || article.description || '',
        relevanceScore: analysis.relevanceScore || 0.5,
        urgency: analysis.urgency || 'medium',
        sources: [article.source],
        relatedArticles: [article],
        contentOpportunities: analysis.contentOpportunities || [],
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Article insight analysis failed:', error);
      return null;
    }
  }

  private calculateMarketSentiment(articles: NewsArticle[]): IndustryAnalysis['marketSentiment'] {
    const sentiments = articles.map(a => a.sentiment).filter(Boolean);
    if (sentiments.length === 0) return 'neutral';

    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    const total = sentiments.length;

    const positiveRatio = positive / total;
    const negativeRatio = negative / total;

    if (positiveRatio > 0.7) return 'very_positive';
    if (positiveRatio > 0.5) return 'positive';
    if (negativeRatio > 0.7) return 'very_negative';
    if (negativeRatio > 0.5) return 'negative';
    return 'neutral';
  }

  private async identifyMarketOpportunities(insights: NewsInsight[]): Promise<string[]> {
    const opportunities = insights
      .filter(insight => insight.type === 'opportunity' || insight.type === 'trend')
      .map(insight => insight.summary)
      .slice(0, 5);

    return opportunities;
  }

  private async identifyMarketRisks(insights: NewsInsight[]): Promise<string[]> {
    const risks = insights
      .filter(insight => insight.type === 'threat')
      .map(insight => insight.summary)
      .slice(0, 5);

    return risks;
  }

  private async generateStrategicRecommendations(
    insights: NewsInsight[], 
    opportunities: string[], 
    risks: string[]
  ): Promise<string[]> {
    // Generate AI-powered strategic recommendations
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate 3-5 strategic recommendations based on the provided market insights, opportunities, and risks. Focus on actionable advice for content strategy and business positioning.'
          },
          {
            role: 'user',
            content: `Market Insights: ${insights.slice(0, 5).map(i => i.summary).join('; ')}
Opportunities: ${opportunities.join('; ')}
Risks: ${risks.join('; ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      });

      const recommendations = response.choices[0].message.content?.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, ''))
        .slice(0, 5) || [];

      return recommendations;

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return ['Monitor industry developments closely', 'Capitalize on emerging trends', 'Prepare risk mitigation strategies'];
    }
  }

  // Continuous monitoring
  private startContinuousMonitoring(): void {
    console.log('🎯 Starting continuous news monitoring...');
    
    // Monitor every 15 minutes
    setInterval(async () => {
      try {
        await this.performRoutineMonitoring();
      } catch (error) {
        console.error('Routine news monitoring failed:', error);
      }
    }, 15 * 60 * 1000);
  }

  private async performRoutineMonitoring(): Promise<void> {
    // Get all active monitoring configs
    const configs = Array.from(this.monitoringConfigs.values());
    
    for (const config of configs) {
      const lastUpdateTime = this.lastUpdate.get(config.industry);
      const shouldUpdate = !lastUpdateTime || 
        Date.now() - lastUpdateTime.getTime() > config.updateFrequency * 60 * 1000;

      if (shouldUpdate) {
        await this.monitorIndustryNews(config.industry, config.keywords);
      }
    }
  }

  // Placeholder methods for interface compliance
  private async monitorBreakingNews(context: Context): Promise<Observation[]> {
    const breakingNews = await this.getBreakingNewsAlerts();
    return breakingNews.map(insight => ({
      id: `breaking_${insight.id}`,
      type: 'news_development',
      content: insight.headline,
      source: 'news_intelligence',
      timestamp: new Date(),
      confidence: insight.relevanceScore,
      metadata: { urgency: insight.urgency, type: 'breaking' }
    }));
  }

  private async trackIndustryDevelopments(context: Context): Promise<Observation[]> { return []; }
  private async monitorCompetitorActivities(context: Context): Promise<Observation[]> { return []; }
  private async detectEmergingTrends(context: Context): Promise<Observation[]> { return []; }
  private async analyzeNewsSignificance(observation: Observation): Promise<any> { return { summary: 'Analysis pending', confidence: 0.5, reasoning: 'Placeholder', level: 'medium' }; }
  private async identifyContentOpportunities(observations: Observation[]): Promise<Thought[]> { return []; }
  private async analyzeCompetitiveImplications(observations: Observation[]): Promise<Thought[]> { return []; }
  private async identifyBreakingNews(articles: NewsArticle[]): Promise<NewsInsight[]> { return []; }
  private async analyzeTrendForContent(trend: TrendData, industry: string): Promise<ContentOpportunity[]> { return []; }
  private async analyzeCompetitorMovements(articles: NewsArticle[]): Promise<CompetitorActivity[]> { return []; }
}

// Export singleton instance
export const globalNewsAgent = new NewsIntelligenceAgent();