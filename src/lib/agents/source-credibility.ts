/**
 * Source Credibility and Attribution System
 * Provides credibility scoring and source attribution for generated content
 */

import { NewsArticle } from '@/lib/external-apis/news-sources';
import { openai } from '@/lib/openai';

interface SourceCredibility {
  source: string;
  credibilityScore: number; // 0-100
  reputation: 'excellent' | 'good' | 'moderate' | 'questionable' | 'poor';
  biasRating: 'left' | 'lean_left' | 'center' | 'lean_right' | 'right' | 'unknown';
  factualReporting: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low';
  established: Date; // When the source was established
  expertise: string[]; // Areas of expertise
  warnings: string[]; // Any credibility warnings
}

interface AttributionRecord {
  id: string;
  contentId: string;
  sourceUrl: string;
  sourceName: string;
  sourceCredibility: number;
  quotedText?: string;
  context: string;
  factChecked: boolean;
  timestamp: Date;
}

interface FactCheckResult {
  claim: string;
  veracity: 'true' | 'mostly_true' | 'partially_true' | 'false' | 'unverified';
  confidence: number;
  sources: string[];
  explanation: string;
  timestamp: Date;
}

export class SourceCredibilityService {
  private credibilityDatabase: Map<string, SourceCredibility> = new Map();
  private attributionRecords: Map<string, AttributionRecord[]> = new Map();
  private factCheckCache: Map<string, FactCheckResult> = new Map();

  constructor() {
    this.initializeCredibilityDatabase();
  }

  private initializeCredibilityDatabase(): void {
    // Initialize with known reputable sources
    const reputableSources: SourceCredibility[] = [
      {
        source: 'Reuters',
        credibilityScore: 95,
        reputation: 'excellent',
        biasRating: 'center',
        factualReporting: 'very_high',
        established: new Date('1851-10-01'),
        expertise: ['news', 'business', 'finance', 'international'],
        warnings: []
      },
      {
        source: 'Associated Press',
        credibilityScore: 94,
        reputation: 'excellent',
        biasRating: 'center',
        factualReporting: 'very_high',
        established: new Date('1846-05-01'),
        expertise: ['news', 'politics', 'international', 'breaking_news'],
        warnings: []
      },
      {
        source: 'Wall Street Journal',
        credibilityScore: 92,
        reputation: 'excellent',
        biasRating: 'lean_right',
        factualReporting: 'high',
        established: new Date('1889-07-08'),
        expertise: ['business', 'finance', 'markets', 'economics'],
        warnings: []
      },
      {
        source: 'Financial Times',
        credibilityScore: 91,
        reputation: 'excellent',
        biasRating: 'center',
        factualReporting: 'very_high',
        established: new Date('1888-01-09'),
        expertise: ['finance', 'business', 'economics', 'international'],
        warnings: []
      },
      {
        source: 'TechCrunch',
        credibilityScore: 78,
        reputation: 'good',
        biasRating: 'lean_left',
        factualReporting: 'mostly_factual',
        established: new Date('2005-06-11'),
        expertise: ['technology', 'startups', 'venture_capital', 'innovation'],
        warnings: []
      },
      {
        source: 'Harvard Business Review',
        credibilityScore: 89,
        reputation: 'excellent',
        biasRating: 'center',
        factualReporting: 'high',
        established: new Date('1922-01-01'),
        expertise: ['business', 'management', 'leadership', 'strategy'],
        warnings: []
      },
      {
        source: 'Forbes',
        credibilityScore: 82,
        reputation: 'good',
        biasRating: 'lean_right',
        factualReporting: 'mostly_factual',
        established: new Date('1917-09-15'),
        expertise: ['business', 'finance', 'entrepreneurship', 'wealth'],
        warnings: []
      }
    ];

    reputableSources.forEach(source => {
      this.credibilityDatabase.set(source.source.toLowerCase(), source);
    });

    console.log(`📊 Initialized credibility database with ${reputableSources.length} sources`);
  }

  async assessSourceCredibility(sourceName: string): Promise<SourceCredibility> {
    const normalizedName = sourceName.toLowerCase();
    
    // Check if we have this source in our database
    const knownSource = this.credibilityDatabase.get(normalizedName);
    if (knownSource) {
      return knownSource;
    }

    // If unknown, perform AI-based assessment
    return await this.performAICredibilityAssessment(sourceName);
  }

  private async performAICredibilityAssessment(sourceName: string): Promise<SourceCredibility> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a media credibility expert. Assess the credibility of the given news source based on journalistic standards, fact-checking reputation, bias, and reliability.

Respond with a JSON object containing:
{
  "credibilityScore": 0-100,
  "reputation": "excellent|good|moderate|questionable|poor",
  "biasRating": "left|lean_left|center|lean_right|right|unknown",
  "factualReporting": "very_high|high|mostly_factual|mixed|low",
  "expertise": ["area1", "area2"],
  "warnings": ["warning1", "warning2"]
}`
          },
          {
            role: 'user',
            content: `Assess the credibility of this news source: ${sourceName}`
          }
        ],
        temperature: 0.1,
        max_tokens: 400
      });

      const assessment = JSON.parse(response.choices[0].message.content || '{}');
      
      const credibility: SourceCredibility = {
        source: sourceName,
        credibilityScore: assessment.credibilityScore || 50,
        reputation: assessment.reputation || 'moderate',
        biasRating: assessment.biasRating || 'unknown',
        factualReporting: assessment.factualReporting || 'mixed',
        established: new Date(), // Unknown establishment date
        expertise: assessment.expertise || [],
        warnings: assessment.warnings || []
      };

      // Cache the assessment
      this.credibilityDatabase.set(sourceName.toLowerCase(), credibility);
      
      return credibility;

    } catch (error) {
      console.error('AI credibility assessment failed:', error);
      
      // Return default moderate assessment
      return {
        source: sourceName,
        credibilityScore: 60,
        reputation: 'moderate',
        biasRating: 'unknown',
        factualReporting: 'mixed',
        established: new Date(),
        expertise: [],
        warnings: ['Assessment unavailable']
      };
    }
  }

  async scoreNewsArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
    console.log(`🔍 Scoring credibility for ${articles.length} articles...`);

    const scoredArticles = await Promise.all(
      articles.map(async (article) => {
        const credibility = await this.assessSourceCredibility(article.source);
        
        return {
          ...article,
          credibilityScore: credibility.credibilityScore,
          sourceReputation: credibility.reputation,
          sourceBias: credibility.biasRating,
          factualReporting: credibility.factualReporting,
          sourceWarnings: credibility.warnings
        };
      })
    );

    // Sort by credibility score (highest first)
    return scoredArticles.sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0));
  }

  async createAttribution(
    contentId: string,
    sources: NewsArticle[],
    context: string
  ): Promise<AttributionRecord[]> {
    const attributions: AttributionRecord[] = [];

    for (const source of sources) {
      const attribution: AttributionRecord = {
        id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId,
        sourceUrl: source.url,
        sourceName: source.source,
        sourceCredibility: source.credibilityScore || 60,
        context,
        factChecked: false,
        timestamp: new Date()
      };

      attributions.push(attribution);
    }

    // Store attributions
    this.attributionRecords.set(contentId, attributions);
    
    return attributions;
  }

  async factCheckClaim(claim: string): Promise<FactCheckResult> {
    const cacheKey = claim.toLowerCase().trim();
    
    // Check cache first
    const cached = this.factCheckCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < 24 * 60 * 60 * 1000) {
      return cached;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checking expert. Assess the veracity of claims based on available knowledge. Be conservative and mark uncertain claims as "unverified".

Respond with JSON:
{
  "veracity": "true|mostly_true|partially_true|false|unverified",
  "confidence": 0-100,
  "explanation": "Brief explanation of assessment",
  "sources": ["source1", "source2"]
}`
          },
          {
            role: 'user',
            content: `Fact-check this claim: "${claim}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const factCheck = JSON.parse(response.choices[0].message.content || '{}');
      
      const result: FactCheckResult = {
        claim,
        veracity: factCheck.veracity || 'unverified',
        confidence: factCheck.confidence || 50,
        sources: factCheck.sources || [],
        explanation: factCheck.explanation || 'Unable to verify',
        timestamp: new Date()
      };

      // Cache the result
      this.factCheckCache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Fact checking failed:', error);
      
      return {
        claim,
        veracity: 'unverified',
        confidence: 0,
        sources: [],
        explanation: 'Fact-checking service unavailable',
        timestamp: new Date()
      };
    }
  }

  generateAttributionText(sources: NewsArticle[]): string {
    if (sources.length === 0) return '';

    const highCredibilitySources = sources.filter(s => (s.credibilityScore || 0) >= 80);
    const sourcesToCredit = highCredibilitySources.length > 0 ? highCredibilitySources : sources;

    if (sourcesToCredit.length === 1) {
      return `Source: ${sourcesToCredit[0].source}`;
    } else if (sourcesToCredit.length <= 3) {
      return `Sources: ${sourcesToCredit.map(s => s.source).join(', ')}`;
    } else {
      return `Sources: ${sourcesToCredit.slice(0, 2).map(s => s.source).join(', ')} and ${sourcesToCredit.length - 2} others`;
    }
  }

  getCredibilityIndicator(credibilityScore: number): string {
    if (credibilityScore >= 90) return '🟢 Highly credible';
    if (credibilityScore >= 80) return '🔵 Credible';
    if (credibilityScore >= 70) return '🟡 Moderately credible';
    if (credibilityScore >= 60) return '🟠 Limited credibility';
    return '🔴 Low credibility';
  }

  async getContentTransparencyReport(contentId: string): Promise<any> {
    const attributions = this.attributionRecords.get(contentId) || [];
    
    const report = {
      contentId,
      totalSources: attributions.length,
      averageCredibility: attributions.length > 0 
        ? attributions.reduce((sum, attr) => sum + attr.sourceCredibility, 0) / attributions.length 
        : 0,
      highCredibilitySources: attributions.filter(attr => attr.sourceCredibility >= 80).length,
      factCheckedClaims: attributions.filter(attr => attr.factChecked).length,
      sources: attributions.map(attr => ({
        name: attr.sourceName,
        url: attr.sourceUrl,
        credibility: attr.sourceCredibility,
        indicator: this.getCredibilityIndicator(attr.sourceCredibility)
      })),
      transparency: this.calculateTransparencyScore(attributions),
      generated: new Date()
    };

    return report;
  }

  private calculateTransparencyScore(attributions: AttributionRecord[]): number {
    if (attributions.length === 0) return 0;

    const avgCredibility = attributions.reduce((sum, attr) => sum + attr.sourceCredibility, 0) / attributions.length;
    const factCheckedRatio = attributions.filter(attr => attr.factChecked).length / attributions.length;
    const diversityScore = new Set(attributions.map(attr => attr.sourceName)).size / attributions.length;

    return Math.round((avgCredibility * 0.5) + (factCheckedRatio * 30) + (diversityScore * 20));
  }
}

// Export singleton instance
export const globalSourceCredibility = new SourceCredibilityService();

// Export types
export type { SourceCredibility, AttributionRecord, FactCheckResult };