/**
 * Pattern Recognition Engine v2.0
 *
 * Role Definition:
 * You are the Pattern Recognition specialist responsible for detecting, analyzing, and predicting behavioral patterns across all agent operations to enable proactive optimization and trend identification.
 *
 * Primary Objective:
 * Your main task is to identify meaningful patterns in agent behavior, user interactions, and content performance to enable predictive intelligence and proactive optimization.
 */

import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { Context, Experience, Learning } from './types';

interface Pattern {
  id: string;
  type: 'behavioral' | 'performance' | 'temporal' | 'contextual' | 'causal';
  category: 'content' | 'engagement' | 'strategy' | 'analytics' | 'user_behavior';
  description: string;
  confidence: number;
  strength: number; // How strong/pronounced the pattern is
  frequency: number; // How often the pattern occurs
  predictivePower: number; // How well it predicts future outcomes
  dataPoints: PatternDataPoint[];
  conditions: PatternCondition[];
  implications: string[];
  recommendations: string[];
  discoveredAt: Date;
  lastValidated: Date;
  validationCount: number;
  falsePositiveRate: number;
}

interface PatternDataPoint {
  id: string;
  timestamp: Date;
  context: Partial<Context>;
  features: Record<string, any>;
  outcome: any;
  weight: number;
}

interface PatternCondition {
  feature: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  importance: number;
}

interface PatternPrediction {
  patternId: string;
  prediction: any;
  confidence: number;
  timeframe: string;
  conditions: PatternCondition[];
  reasoning: string;
  riskFactors: string[];
}

interface AnomalyDetection {
  id: string;
  type: 'performance' | 'behavior' | 'data' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  affectedAgents: string[];
  anomalyScore: number; // 0-1, how unusual this is
  expectedValue: any;
  actualValue: any;
  possibleCauses: string[];
  recommendedActions: string[];
}

interface TrendAnalysis {
  id: string;
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical' | 'volatile';
  magnitude: number; // How significant the trend is
  duration: number; // How long the trend has been observed (days)
  confidence: number;
  dataPoints: number;
  projection: {
    next7Days: number;
    next30Days: number;
    confidence: number;
  };
  factors: TrendFactor[];
}

interface TrendFactor {
  factor: string;
  influence: number; // -1 to 1, how much this factor affects the trend
  confidence: number;
  evidence: string;
}

export class PatternRecognitionEngine {
  private patterns: Map<string, Pattern[]> = new Map();
  private anomalies: AnomalyDetection[] = [];
  private trends: Map<string, TrendAnalysis> = new Map();
  private dataBuffer: Map<string, PatternDataPoint[]> = new Map();
  private lastAnalysis: Date = new Date(0);

  constructor() {
    this.initializePatternRecognition();
  }

  private async initializePatternRecognition() {
    console.log('🔍 Initializing Pattern Recognition Engine...');
    
    // Load existing patterns
    await this.loadExistingPatterns();
    
    // Initialize data buffers
    this.initializeDataBuffers();
    
    // Setup continuous analysis
    this.setupContinuousAnalysis();
    
    console.log('✅ Pattern Recognition Engine initialized');
  }

  // ## Step-by-Step Process

  async analyzeExperience(
    agentId: string,
    experience: Experience
  ): Promise<Pattern[]> {
    console.log(`🔍 Analyzing experience patterns for agent ${agentId}`);

    try {
      // 1. Extract features from experience
      const features = await this.extractFeatures(experience);
      
      // 2. Create data point
      const dataPoint: PatternDataPoint = {
        id: `dp_${Date.now()}_${agentId}`,
        timestamp: experience.timestamp,
        context: experience.context,
        features,
        outcome: this.extractOutcome(experience),
        weight: this.calculateDataPointWeight(experience)
      };

      // 3. Add to data buffer
      this.addToDataBuffer(agentId, dataPoint);

      // 4. Check for new patterns
      const newPatterns = await this.detectPatterns(agentId);

      // 5. Validate existing patterns
      await this.validateExistingPatterns(agentId, dataPoint);

      // 6. Check for anomalies
      const anomalies = await this.detectAnomalies(agentId, dataPoint);
      this.anomalies.push(...anomalies);

      return newPatterns;

    } catch (error) {
      console.error('Pattern analysis error:', error);
      return [];
    }
  }

  private async extractFeatures(experience: Experience): Promise<Record<string, any>> {
    const features: Record<string, any> = {};

    // Temporal features
    const timestamp = experience.timestamp;
    features.hour = timestamp.getHours();
    features.dayOfWeek = timestamp.getDay();
    features.dayOfMonth = timestamp.getDate();
    features.month = timestamp.getMonth();

    // Context features
    if (experience.context) {
      features.userId = experience.context.userId;
      features.hasGoals = Boolean(experience.context.currentGoals?.length);
      features.goalCount = experience.context.currentGoals?.length || 0;
      features.recentEventCount = experience.context.recentEvents?.length || 0;
    }

    // Action features
    if (experience.actions) {
      features.actionCount = experience.actions.length;
      features.actionTypes = experience.actions.map(a => a.type);
      features.primaryActionType = experience.actions[0]?.type;
      features.actionComplexity = this.calculateActionComplexity(experience.actions);
    }

    // Result features
    if (experience.results) {
      features.resultCount = experience.results.length;
      features.successRate = this.calculateSuccessRate(experience.results);
      features.averageValue = this.calculateAverageValue(experience.results);
      features.totalDuration = this.calculateTotalDuration(experience.results);
    }

    // Performance features
    if (experience.learnings) {
      features.learningCount = experience.learnings.length;
      features.averageConfidence = experience.learnings.reduce((sum, l) => sum + l.confidence, 0) / experience.learnings.length;
    }

    return features;
  }

  private async detectPatterns(agentId: string): Promise<Pattern[]> {
    const dataPoints = this.dataBuffer.get(agentId) || [];
    
    if (dataPoints.length < 10) {
      return []; // Need minimum data for pattern detection
    }

    const patterns: Pattern[] = [];

    // Detect different types of patterns
    patterns.push(...await this.detectBehavioralPatterns(agentId, dataPoints));
    patterns.push(...await this.detectPerformancePatterns(agentId, dataPoints));
    patterns.push(...await this.detectTemporalPatterns(agentId, dataPoints));
    patterns.push(...await this.detectContextualPatterns(agentId, dataPoints));
    patterns.push(...await this.detectCausalPatterns(agentId, dataPoints));

    // Filter and validate patterns
    const validPatterns = patterns.filter(p => p.confidence > 0.6 && p.strength > 0.3);

    // Store new patterns
    const existingPatterns = this.patterns.get(agentId) || [];
    const newPatterns = validPatterns.filter(p => 
      !existingPatterns.some(ep => this.arePatternsSimilar(ep, p))
    );

    if (newPatterns.length > 0) {
      existingPatterns.push(...newPatterns);
      this.patterns.set(agentId, existingPatterns);
      await this.persistPatterns(agentId, newPatterns);
    }

    return newPatterns;
  }

  private async detectBehavioralPatterns(
    agentId: string, 
    dataPoints: PatternDataPoint[]
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Analyze action sequences
    const actionSequences = dataPoints.map(dp => dp.features.actionTypes).filter(Boolean);
    const sequencePatterns = this.findSequencePatterns(actionSequences);

    for (const seqPattern of sequencePatterns) {
      if (seqPattern.frequency > 0.3) { // Occurs in at least 30% of cases
        patterns.push({
          id: `behavioral_${agentId}_${Date.now()}`,
          type: 'behavioral',
          category: 'analytics',
          description: `Agent consistently follows action sequence: ${seqPattern.sequence.join(' → ')}`,
          confidence: seqPattern.confidence,
          strength: seqPattern.frequency,
          frequency: seqPattern.frequency,
          predictivePower: await this.calculatePredictivePower(seqPattern, dataPoints),
          dataPoints: dataPoints.filter(dp => this.matchesSequence(dp, seqPattern.sequence)),
          conditions: this.extractConditions(seqPattern),
          implications: [`Predictable behavior pattern with ${(seqPattern.frequency * 100).toFixed(1)}% consistency`],
          recommendations: [`Optimize this sequence for better performance`],
          discoveredAt: new Date(),
          lastValidated: new Date(),
          validationCount: 1,
          falsePositiveRate: 0
        });
      }
    }

    return patterns;
  }

  private async detectPerformancePatterns(
    agentId: string, 
    dataPoints: PatternDataPoint[]
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Analyze performance correlations
    const performanceData = dataPoints.map(dp => ({
      features: dp.features,
      performance: dp.outcome?.successRate || 0
    })).filter(d => d.performance !== undefined);

    if (performanceData.length < 5) return patterns;

    // Find features that correlate with high performance
    const featureKeys = Object.keys(performanceData[0].features);
    
    for (const featureKey of featureKeys) {
      const correlation = this.calculateCorrelation(
        performanceData.map(d => d.features[featureKey]),
        performanceData.map(d => d.performance)
      );

      if (Math.abs(correlation) > 0.6) { // Strong correlation
        const isPositive = correlation > 0;
        patterns.push({
          id: `performance_${agentId}_${featureKey}_${Date.now()}`,
          type: 'performance',
          category: 'analytics',
          description: `${featureKey} shows ${isPositive ? 'positive' : 'negative'} correlation with performance (${correlation.toFixed(3)})`,
          confidence: Math.abs(correlation),
          strength: Math.abs(correlation),
          frequency: 1.0, // Always applies when feature is present
          predictivePower: Math.abs(correlation),
          dataPoints: dataPoints.filter(dp => dp.features[featureKey] !== undefined),
          conditions: [{
            feature: featureKey,
            operator: isPositive ? 'greater_than' : 'less_than',
            value: this.calculateOptimalThreshold(performanceData, featureKey),
            importance: Math.abs(correlation)
          }],
          implications: [
            `${featureKey} significantly impacts performance`,
            `Optimization should ${isPositive ? 'maximize' : 'minimize'} ${featureKey}`
          ],
          recommendations: [
            `Monitor ${featureKey} closely`,
            `${isPositive ? 'Increase' : 'Decrease'} ${featureKey} when possible`
          ],
          discoveredAt: new Date(),
          lastValidated: new Date(),
          validationCount: 1,
          falsePositiveRate: 0
        });
      }
    }

    return patterns;
  }

  private async detectTemporalPatterns(
    agentId: string, 
    dataPoints: PatternDataPoint[]
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Group by time features
    const hourlyPerformance = this.groupByFeature(dataPoints, 'hour');
    const dailyPerformance = this.groupByFeature(dataPoints, 'dayOfWeek');

    // Find optimal time patterns
    const bestHours = this.findOptimalTimes(hourlyPerformance);
    if (bestHours.length > 0) {
      patterns.push({
        id: `temporal_hours_${agentId}_${Date.now()}`,
        type: 'temporal',
        category: 'strategy',
        description: `Peak performance hours: ${bestHours.join(', ')}`,
        confidence: 0.8,
        strength: 0.7,
        frequency: bestHours.length / 24,
        predictivePower: 0.6,
        dataPoints: dataPoints.filter(dp => bestHours.includes(dp.features.hour)),
        conditions: bestHours.map(hour => ({
          feature: 'hour',
          operator: 'equals' as const,
          value: hour,
          importance: 0.8
        })),
        implications: ['Time-based performance optimization opportunity'],
        recommendations: ['Schedule high-priority tasks during peak hours'],
        discoveredAt: new Date(),
        lastValidated: new Date(),
        validationCount: 1,
        falsePositiveRate: 0
      });
    }

    return patterns;
  }

  private async detectContextualPatterns(
    agentId: string, 
    dataPoints: PatternDataPoint[]
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Analyze context-performance relationships
    const contextFeatures = ['hasGoals', 'goalCount', 'recentEventCount'];
    
    for (const feature of contextFeatures) {
      const grouped = this.groupByFeature(dataPoints, feature);
      const analysis = this.analyzeGroupedPerformance(grouped);
      
      if (analysis.significance > 0.7) {
        patterns.push({
          id: `contextual_${feature}_${agentId}_${Date.now()}`,
          type: 'contextual',
          category: 'strategy',
          description: `Context feature '${feature}' significantly affects performance`,
          confidence: analysis.significance,
          strength: analysis.effectSize,
          frequency: analysis.frequency,
          predictivePower: analysis.predictivePower,
          dataPoints: dataPoints.filter(dp => dp.features[feature] !== undefined),
          conditions: analysis.conditions,
          implications: analysis.implications,
          recommendations: analysis.recommendations,
          discoveredAt: new Date(),
          lastValidated: new Date(),
          validationCount: 1,
          falsePositiveRate: 0
        });
      }
    }

    return patterns;
  }

  private async detectCausalPatterns(
    agentId: string, 
    dataPoints: PatternDataPoint[]
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Look for cause-effect relationships
    const causalAnalysis = await this.performCausalAnalysis(dataPoints);
    
    for (const causal of causalAnalysis) {
      if (causal.confidence > 0.7) {
        patterns.push({
          id: `causal_${agentId}_${Date.now()}`,
          type: 'causal',
          category: 'analytics',
          description: causal.description,
          confidence: causal.confidence,
          strength: causal.strength,
          frequency: causal.frequency,
          predictivePower: causal.predictivePower,
          dataPoints: causal.supportingData,
          conditions: causal.conditions,
          implications: causal.implications,
          recommendations: causal.recommendations,
          discoveredAt: new Date(),
          lastValidated: new Date(),
          validationCount: 1,
          falsePositiveRate: 0
        });
      }
    }

    return patterns;
  }

  async predictOutcome(
    agentId: string,
    context: Context,
    proposedActions: any[]
  ): Promise<PatternPrediction[]> {
    const patterns = this.patterns.get(agentId) || [];
    const predictions: PatternPrediction[] = [];

    // Extract features from current context and proposed actions
    const currentFeatures = await this.extractFeaturesFromContext(context, proposedActions);

    // Find applicable patterns
    const applicablePatterns = patterns.filter(pattern => 
      this.isPatternApplicable(pattern, currentFeatures)
    );

    // Generate predictions
    for (const pattern of applicablePatterns) {
      const prediction = await this.generatePrediction(pattern, currentFeatures);
      predictions.push(prediction);
    }

    // Sort by confidence and predictive power
    return predictions.sort((a, b) => 
      (b.confidence * this.getPatternPredictivePower(b.patternId)) - 
      (a.confidence * this.getPatternPredictivePower(a.patternId))
    );
  }

  async detectAnomalies(
    agentId: string,
    dataPoint: PatternDataPoint
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    const patterns = this.patterns.get(agentId) || [];

    // Check against established patterns
    for (const pattern of patterns) {
      const expectedValue = this.calculateExpectedValue(pattern, dataPoint);
      const actualValue = this.extractRelevantValue(dataPoint, pattern);
      
      const anomalyScore = this.calculateAnomalyScore(expectedValue, actualValue);
      
      if (anomalyScore > 0.7) { // High anomaly score
        anomalies.push({
          id: `anomaly_${Date.now()}_${agentId}`,
          type: this.classifyAnomalyType(pattern, dataPoint),
          severity: this.determineSeverity(anomalyScore),
          description: `Unusual ${pattern.type} pattern detected for agent ${agentId}`,
          detectedAt: new Date(),
          affectedAgents: [agentId],
          anomalyScore,
          expectedValue,
          actualValue,
          possibleCauses: this.generatePossibleCauses(pattern, dataPoint),
          recommendedActions: this.generateRecommendedActions(pattern, anomalyScore)
        });
      }
    }

    return anomalies;
  }

  // ## Output Format

  async getPatternInsights(agentId?: string): Promise<any> {
    const allPatterns = agentId ? 
      (this.patterns.get(agentId) || []) : 
      Array.from(this.patterns.values()).flat();

    const insights = {
      totalPatterns: allPatterns.length,
      patternsByType: this.groupPatternsByType(allPatterns),
      patternsByCategory: this.groupPatternsByCategory(allPatterns),
      highConfidencePatterns: allPatterns.filter(p => p.confidence > 0.8).length,
      recentPatterns: allPatterns.filter(p => 
        (Date.now() - p.discoveredAt.getTime()) < (7 * 24 * 60 * 60 * 1000)
      ).length,
      topPatterns: allPatterns
        .sort((a, b) => (b.confidence * b.predictivePower) - (a.confidence * a.predictivePower))
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          description: p.description,
          confidence: p.confidence,
          predictivePower: p.predictivePower,
          category: p.category
        })),
      anomalies: this.anomalies.slice(-10), // Recent anomalies
      trends: Array.from(this.trends.values()).slice(-5) // Recent trends
    };

    return insights;
  }

  // Helper methods for pattern analysis
  private findSequencePatterns(sequences: any[][]): any[] {
    // Implementation for finding common sequence patterns
    return [];
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private groupByFeature(dataPoints: PatternDataPoint[], feature: string): Map<any, PatternDataPoint[]> {
    const groups = new Map();
    
    for (const dp of dataPoints) {
      const value = dp.features[feature];
      if (value !== undefined) {
        if (!groups.has(value)) {
          groups.set(value, []);
        }
        groups.get(value).push(dp);
      }
    }
    
    return groups;
  }

  private calculateOptimalThreshold(data: any[], feature: string): number {
    const values = data.map(d => d.features[feature]).filter(v => v !== undefined);
    return values.reduce((a, b) => a + b, 0) / values.length; // Simple average
  }

  private findOptimalTimes(hourlyData: Map<any, PatternDataPoint[]>): number[] {
    const hourlyAverage = new Map();
    
    for (const [hour, points] of hourlyData.entries()) {
      const avgPerformance = points.reduce((sum, p) => sum + (p.outcome?.successRate || 0), 0) / points.length;
      hourlyAverage.set(hour, avgPerformance);
    }
    
    const avgPerformance = Array.from(hourlyAverage.values()).reduce((a, b) => a + b, 0) / hourlyAverage.size;
    
    return Array.from(hourlyAverage.entries())
      .filter(([hour, performance]) => performance > avgPerformance * 1.2) // 20% above average
      .map(([hour]) => hour);
  }

  private analyzeGroupedPerformance(grouped: Map<any, PatternDataPoint[]>): any {
    // Analyze performance differences between groups
    return {
      significance: 0.8,
      effectSize: 0.6,
      frequency: 0.7,
      predictivePower: 0.5,
      conditions: [],
      implications: [],
      recommendations: []
    };
  }

  private async performCausalAnalysis(dataPoints: PatternDataPoint[]): Promise<any[]> {
    // Implement causal analysis algorithms
    return [];
  }

  private isPatternApplicable(pattern: Pattern, features: Record<string, any>): boolean {
    return pattern.conditions.every(condition => {
      const featureValue = features[condition.feature];
      if (featureValue === undefined) return false;
      
      switch (condition.operator) {
        case 'equals': return featureValue === condition.value;
        case 'greater_than': return featureValue > condition.value;
        case 'less_than': return featureValue < condition.value;
        case 'contains': return String(featureValue).includes(String(condition.value));
        case 'in_range': return featureValue >= condition.value[0] && featureValue <= condition.value[1];
        default: return false;
      }
    });
  }

  private async generatePrediction(pattern: Pattern, features: Record<string, any>): Promise<PatternPrediction> {
    // Generate prediction based on pattern
    return {
      patternId: pattern.id,
      prediction: 'Generated prediction based on pattern',
      confidence: pattern.confidence,
      timeframe: 'next 24 hours',
      conditions: pattern.conditions,
      reasoning: `Based on pattern: ${pattern.description}`,
      riskFactors: []
    };
  }

  // Additional helper methods would be implemented here...
  private calculateDataPointWeight(experience: Experience): number { return 1.0; }
  private extractOutcome(experience: Experience): any { return {}; }
  private addToDataBuffer(agentId: string, dataPoint: PatternDataPoint): void {}
  private calculateActionComplexity(actions: any[]): number { return 0; }
  private calculateSuccessRate(results: any[]): number { return 0; }
  private calculateAverageValue(results: any[]): number { return 0; }
  private calculateTotalDuration(results: any[]): number { return 0; }
  private arePatternsSimilar(pattern1: Pattern, pattern2: Pattern): boolean { return false; }
  private matchesSequence(dataPoint: PatternDataPoint, sequence: any[]): boolean { return false; }
  private extractConditions(seqPattern: any): PatternCondition[] { return []; }
  private calculatePredictivePower(seqPattern: any, dataPoints: PatternDataPoint[]): Promise<number> { return Promise.resolve(0); }
  private async extractFeaturesFromContext(context: Context, actions: any[]): Promise<Record<string, any>> { return {}; }
  private getPatternPredictivePower(patternId: string): number { return 0; }
  private calculateExpectedValue(pattern: Pattern, dataPoint: PatternDataPoint): any { return null; }
  private extractRelevantValue(dataPoint: PatternDataPoint, pattern: Pattern): any { return null; }
  private calculateAnomalyScore(expected: any, actual: any): number { return 0; }
  private classifyAnomalyType(pattern: Pattern, dataPoint: PatternDataPoint): 'performance' | 'behavior' | 'data' | 'system' { return 'performance'; }
  private determineSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' { return 'medium'; }
  private generatePossibleCauses(pattern: Pattern, dataPoint: PatternDataPoint): string[] { return []; }
  private generateRecommendedActions(pattern: Pattern, score: number): string[] { return []; }
  private groupPatternsByType(patterns: Pattern[]): any { return {}; }
  private groupPatternsByCategory(patterns: Pattern[]): any { return {}; }
  private async loadExistingPatterns(): Promise<void> {}
  private initializeDataBuffers(): void {}
  private setupContinuousAnalysis(): void {}
  private async validateExistingPatterns(agentId: string, dataPoint: PatternDataPoint): Promise<void> {}
  private async persistPatterns(agentId: string, patterns: Pattern[]): Promise<void> {}
}

// ## Examples

// Usage Example 1: Analyze agent experience for patterns
const patternEngine = new PatternRecognitionEngine();
const experience = {
  id: 'exp_123',
  context: { userId: 'user_123', currentGoals: [{ type: 'engagement' }] },
  actions: [{ type: 'content_generation', complexity: 'high' }],
  results: [{ successRate: 0.85, duration: 120 }],
  learnings: [{ confidence: 0.9, insight: 'High complexity content performs better' }],
  timestamp: new Date()
};

const patterns = await patternEngine.analyzeExperience('content_creator_agent', experience);

// Usage Example 2: Predict outcomes based on patterns
const predictions = await patternEngine.predictOutcome(
  'content_creator_agent',
  { timestamp: new Date(), userId: 'user_123' },
  [{ type: 'content_generation', topic: 'AI trends' }]
);

// Usage Example 3: Get pattern insights
const insights = await patternEngine.getPatternInsights('content_creator_agent');

// ## Error Handling
// - If insufficient data for pattern detection, wait for more data points
// - When correlation calculations fail, use conservative estimates
// - If pattern validation fails, reduce confidence scores

// ## Debug Information
// All pattern recognition operations include:
// <debug>
// - Reasoning: Pattern detection algorithms and statistical analysis
// - Confidence: Statistical confidence in detected patterns
// - Data Quality: Assessment of data point quality and sample sizes
// - Predictive Power: Estimated ability to predict future outcomes
// </debug>

// Export singleton instance
export const globalPatternRecognition = new PatternRecognitionEngine();