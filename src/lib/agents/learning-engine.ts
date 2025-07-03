/**
 * Learning Engine v2.0
 *
 * Role Definition:
 * You are the Learning Engine responsible for continuous improvement of agent performance through experience-based learning, pattern recognition, and adaptive optimization.
 *
 * Primary Objective:
 * Your main task is to analyze agent experiences, extract actionable insights, and continuously optimize agent performance through evidence-based learning algorithms.
 */

import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { AgentMessage, Experience, Learning, Context } from './types';

interface LearningPattern {
  id: string;
  agentId: string;
  category: 'content' | 'engagement' | 'strategy' | 'analytics';
  pattern: string;
  confidence: number;
  evidence: Evidence[];
  applicability: ApplicabilityRule[];
  performance: {
    successRate: number;
    avgImprovement: number;
    sampleSize: number;
  };
  createdAt: Date;
  lastValidated: Date;
}

interface Evidence {
  experienceId: string;
  context: Partial<Context>;
  action: any;
  result: any;
  outcome: 'success' | 'failure' | 'neutral';
  metrics: Record<string, number>;
}

interface ApplicabilityRule {
  condition: string;
  weight: number;
  contextKeys: string[];
}

interface LearningObjective {
  id: string;
  agentId: string;
  objective: string;
  targetMetric: string;
  currentPerformance: number;
  targetPerformance: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  experiments: Experiment[];
  status: 'active' | 'completed' | 'paused';
}

interface Experiment {
  id: string;
  hypothesis: string;
  methodology: string;
  variables: {
    independent: Variable[];
    dependent: Variable[];
    controlled: Variable[];
  };
  status: 'planned' | 'running' | 'analyzing' | 'completed';
  results?: ExperimentResult;
}

interface Variable {
  name: string;
  type: 'categorical' | 'numerical' | 'boolean';
  values: any[];
  currentValue: any;
}

interface ExperimentResult {
  duration: number; // days
  samples: number;
  metrics: Record<string, {
    baseline: number;
    experiment: number;
    improvement: number;
    significance: number;
  }>;
  insights: string[];
  recommendation: 'adopt' | 'reject' | 'modify';
}

export class LearningEngine {
  private patterns: Map<string, LearningPattern[]> = new Map();
  private objectives: Map<string, LearningObjective[]> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private learningHistory: Map<string, Learning[]> = new Map();

  constructor() {
    this.initializeLearningSystem();
  }

  private async initializeLearningSystem() {
    console.log('🧠 Initializing Learning Engine...');
    
    // Load existing patterns and objectives from database
    await this.loadLearningData();
    
    // Initialize learning objectives for each agent
    await this.initializeAgentObjectives();
    
    console.log('✅ Learning Engine initialized');
  }

  // ## Step-by-Step Process

  async learnFromExperience(
    agentId: string, 
    experience: Experience
  ): Promise<Learning[]> {
    const learnings: Learning[] = [];

    try {
      // 1. Analyze experience for patterns
      const patterns = await this.extractPatterns(agentId, experience);
      
      // 2. Update existing patterns or create new ones
      for (const pattern of patterns) {
        await this.updatePattern(agentId, pattern, experience);
        
        learnings.push({
          id: `learning_${Date.now()}_${Math.random()}`,
          insight: pattern.insight,
          evidence: pattern.evidence,
          confidence: pattern.confidence,
          applicability: pattern.applicability || 'general',
          timestamp: new Date()
        });
      }

      // 3. Evaluate against current learning objectives
      const objectiveLearnings = await this.evaluateObjectives(agentId, experience);
      learnings.push(...objectiveLearnings);

      // 4. Store learnings in agent memory
      await this.storeLearnings(agentId, learnings);

      // 5. Trigger pattern recognition updates
      await this.updatePatternRecognition(agentId);

      console.log(`🎓 Agent ${agentId} learned ${learnings.length} insights from experience`);
      
      return learnings;

    } catch (error) {
      console.error('Learning engine error:', error);
      return [];
    }
  }

  private async extractPatterns(
    agentId: string, 
    experience: Experience
  ): Promise<any[]> {
    const prompt = this.buildPatternExtractionPrompt(agentId, experience);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });

    try {
      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis.patterns || [];
    } catch (error) {
      console.error('Failed to parse pattern extraction:', error);
      return [];
    }
  }

  private buildPatternExtractionPrompt(
    agentId: string, 
    experience: Experience
  ): string {
    return `# Pattern Extraction Agent v2.0

// ## Role Definition
You are a pattern recognition expert specializing in extracting actionable insights from agent experiences for continuous learning and improvement.

// ## Primary Objective
Analyze the given experience and extract meaningful patterns that can improve future agent performance.

// ## Context
// - Agent ID: ${agentId}
// - Experience Context: ${JSON.stringify(experience.context, null, 2)}
// - Actions Taken: ${JSON.stringify(experience.actions, null, 2)}
// - Results Achieved: ${JSON.stringify(experience.results, null, 2)}
// - Timestamp: ${experience.timestamp}

// ## Step-by-Step Process
1. Analyze the relationship between context, actions, and results
2. Identify what worked well and what didn't
3. Extract generalizable patterns that could apply to similar situations
4. Assess the confidence level of each pattern
5. Determine applicability conditions for each pattern

// ## Output Format
<output>
{
  "patterns": [
    {
      "insight": "Specific, actionable insight",
      "evidence": "What evidence supports this insight",
      "confidence": 0.85,
      "applicability": "When/where this pattern applies",
      "category": "content|engagement|strategy|analytics",
      "recommendation": "Specific action to take based on this pattern"
    }
  ],
  "meta_insights": [
    "Higher-level insights about learning process itself"
  ]
}
</output>

// ## Examples
Pattern 1: "Content with industry-specific technical terms performs 23% better in B2B SaaS audience"
Pattern 2: "Engagement responses within 2 hours receive 3x more follow-up interactions"
Pattern 3: "Strategy pivots during market uncertainty show higher long-term performance"

// ## Error Handling
// - If experience data is incomplete, focus on available information
// - When patterns are unclear, indicate lower confidence scores
// - If no patterns are detectable, return empty patterns array

// ## Debug Information
// Always include:
// <debug>
// - Reasoning: [your pattern detection process]
// - Confidence: [0-100]% in pattern validity
// - Sample Size: [how much data supports this pattern]
// - Next Steps: [what additional data would strengthen these patterns]
// </debug>`;
  }

  async updatePattern(
    agentId: string, 
    newPattern: any, 
    experience: Experience
  ): Promise<void> {
    const agentPatterns = this.patterns.get(agentId) || [];
    
    // Check if similar pattern exists
    const existingPattern = agentPatterns.find(p => 
      p.category === newPattern.category && 
      this.calculateSimilarity(p.pattern, newPattern.insight) > 0.8
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.evidence.push({
        experienceId: experience.id || `exp_${Date.now()}`,
        context: experience.context,
        action: experience.actions[0], // Simplified
        result: experience.results[0], // Simplified
        outcome: this.determineOutcome(experience),
        metrics: this.extractMetrics(experience)
      });

      // Recalculate confidence and performance
      existingPattern.confidence = this.calculatePatternConfidence(existingPattern);
      existingPattern.performance = this.calculatePatternPerformance(existingPattern);
      existingPattern.lastValidated = new Date();
      
    } else {
      // Create new pattern
      const pattern: LearningPattern = {
        id: `pattern_${agentId}_${Date.now()}`,
        agentId,
        category: newPattern.category,
        pattern: newPattern.insight,
        confidence: newPattern.confidence,
        evidence: [{
          experienceId: experience.id || `exp_${Date.now()}`,
          context: experience.context,
          action: experience.actions[0],
          result: experience.results[0],
          outcome: this.determineOutcome(experience),
          metrics: this.extractMetrics(experience)
        }],
        applicability: this.parseApplicabilityRules(newPattern.applicability),
        performance: {
          successRate: newPattern.confidence,
          avgImprovement: 0,
          sampleSize: 1
        },
        createdAt: new Date(),
        lastValidated: new Date()
      };
      
      agentPatterns.push(pattern);
    }

    this.patterns.set(agentId, agentPatterns);
    
    // Persist to database
    await this.persistPattern(existingPattern || agentPatterns[agentPatterns.length - 1]);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation - could be enhanced with more sophisticated NLP
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private determineOutcome(experience: Experience): 'success' | 'failure' | 'neutral' {
    // Analyze results to determine outcome
    const results = experience.results || [];
    const successCount = results.filter(r => r.status === 'completed' || r.success).length;
    const totalResults = results.length;
    
    if (totalResults === 0) return 'neutral';
    if (successCount / totalResults >= 0.7) return 'success';
    if (successCount / totalResults <= 0.3) return 'failure';
    return 'neutral';
  }

  private extractMetrics(experience: Experience): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Extract quantitative metrics from results
    experience.results?.forEach((result, index) => {
      if (typeof result.value === 'number') {
        metrics[`result_${index}_value`] = result.value;
      }
      if (result.duration) {
        metrics[`result_${index}_duration`] = result.duration;
      }
      if (result.score) {
        metrics[`result_${index}_score`] = result.score;
      }
    });

    return metrics;
  }

  private calculatePatternConfidence(pattern: LearningPattern): number {
    const evidence = pattern.evidence;
    const successCount = evidence.filter(e => e.outcome === 'success').length;
    const totalCount = evidence.length;
    
    if (totalCount === 0) return 0;
    
    // Base confidence from success rate
    const successRate = successCount / totalCount;
    
    // Adjust for sample size (more samples = higher confidence)
    const sampleSizeBonus = Math.min(0.2, totalCount / 50);
    
    // Adjust for recency (more recent evidence = higher confidence)
    const avgAge = evidence.reduce((sum, e) => sum + (Date.now() - new Date(e.experienceId).getTime()), 0) / evidence.length;
    const recencyBonus = Math.max(0, 0.1 - (avgAge / (30 * 24 * 60 * 60 * 1000))); // 30 days
    
    return Math.min(1, successRate + sampleSizeBonus + recencyBonus);
  }

  private calculatePatternPerformance(pattern: LearningPattern): any {
    const evidence = pattern.evidence;
    const successfulEvidence = evidence.filter(e => e.outcome === 'success');
    
    return {
      successRate: successfulEvidence.length / evidence.length,
      avgImprovement: this.calculateAverageImprovement(successfulEvidence),
      sampleSize: evidence.length
    };
  }

  private calculateAverageImprovement(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    const improvements = evidence.map(e => {
      const metrics = Object.values(e.metrics);
      return metrics.length > 0 ? metrics.reduce((a, b) => a + b, 0) / metrics.length : 0;
    });
    
    return improvements.reduce((a, b) => a + b, 0) / improvements.length;
  }

  private parseApplicabilityRules(applicability: string): ApplicabilityRule[] {
    // Simple parsing - could be enhanced with more sophisticated rule parsing
    return [{
      condition: applicability,
      weight: 1.0,
      contextKeys: ['general']
    }];
  }

  async getOptimizationRecommendations(
    agentId: string, 
    currentContext: Context
  ): Promise<string[]> {
    const patterns = this.patterns.get(agentId) || [];
    const recommendations: string[] = [];

    // Find applicable patterns based on current context
    const applicablePatterns = patterns.filter(pattern => 
      pattern.confidence > 0.7 && 
      this.isPatternApplicable(pattern, currentContext)
    );

    // Sort by confidence and performance
    applicablePatterns.sort((a, b) => 
      (b.confidence * b.performance.successRate) - (a.confidence * a.performance.successRate)
    );

    // Generate recommendations from top patterns
    for (const pattern of applicablePatterns.slice(0, 5)) {
      recommendations.push(
        `Based on ${pattern.evidence.length} experiences: ${pattern.pattern}`
      );
    }

    return recommendations;
  }

  private isPatternApplicable(pattern: LearningPattern, context: Context): boolean {
    // Simple applicability check - could be enhanced with more sophisticated rule evaluation
    for (const rule of pattern.applicability) {
      // Check if context keys match
      const hasRequiredContext = rule.contextKeys.every(key => 
        key === 'general' || context.hasOwnProperty(key)
      );
      
      if (hasRequiredContext) {
        return true;
      }
    }
    
    return false;
  }

  // ## Output Format

  async generateLearningReport(agentId: string): Promise<any> {
    const patterns = this.patterns.get(agentId) || [];
    const objectives = this.objectives.get(agentId) || [];
    
    return {
      agentId,
      totalPatterns: patterns.length,
      highConfidencePatterns: patterns.filter(p => p.confidence > 0.8).length,
      activeObjectives: objectives.filter(o => o.status === 'active').length,
      completedObjectives: objectives.filter(o => o.status === 'completed').length,
      topPatterns: patterns
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map(p => ({
          pattern: p.pattern,
          confidence: p.confidence,
          evidence: p.evidence.length,
          category: p.category
        })),
      learningVelocity: this.calculateLearningVelocity(agentId),
      recommendations: await this.getOptimizationRecommendations(agentId, { timestamp: new Date() })
    };
  }

  private calculateLearningVelocity(agentId: string): number {
    const patterns = this.patterns.get(agentId) || [];
    const recentPatterns = patterns.filter(p => 
      (Date.now() - p.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    
    return recentPatterns.length; // Patterns learned per week
  }

  // Database persistence methods
  private async loadLearningData(): Promise<void> {
    // Implementation would load from Supabase
    console.log('📚 Loading learning data from database...');
  }

  private async initializeAgentObjectives(): Promise<void> {
    // Implementation would set up default learning objectives
    console.log('🎯 Initializing agent learning objectives...');
  }

  private async persistPattern(pattern: LearningPattern): Promise<void> {
    // Implementation would save to Supabase
    console.log(`💾 Persisting pattern: ${pattern.id}`);
  }

  private async storeLearnings(agentId: string, learnings: Learning[]): Promise<void> {
    const existing = this.learningHistory.get(agentId) || [];
    existing.push(...learnings);
    this.learningHistory.set(agentId, existing);
  }

  private async updatePatternRecognition(agentId: string): Promise<void> {
    // Trigger pattern recognition updates
    console.log(`🔍 Updating pattern recognition for agent ${agentId}`);
  }

  private async evaluateObjectives(agentId: string, experience: Experience): Promise<Learning[]> {
    // Evaluate experience against learning objectives
    return [];
  }
}

// ## Examples

// Usage Example 1: Learn from agent experience
const learningEngine = new LearningEngine();
const experience = {
  id: 'exp_123',
  context: { userId: 'user_123', platform: 'linkedin' },
  actions: [{ type: 'content_generation', parameters: { topic: 'AI trends' } }],
  results: [{ status: 'completed', engagement: 150, reach: 1200 }],
  learnings: [],
  timestamp: new Date()
};

const learnings = await learningEngine.learnFromExperience('content_creator_agent', experience);

// Usage Example 2: Get optimization recommendations
const recommendations = await learningEngine.getOptimizationRecommendations(
  'content_creator_agent',
  { timestamp: new Date(), userId: 'user_123' }
);

// Usage Example 3: Generate learning report
const report = await learningEngine.generateLearningReport('content_creator_agent');

// ## Error Handling
// - If pattern extraction fails, continue with available data
// - When database operations fail, maintain in-memory state
// - If confidence calculations are invalid, use conservative defaults

// ## Debug Information
// All learning operations include:
// <debug>
// - Reasoning: Pattern extraction and confidence calculation process
// - Confidence: Evidence-based confidence in learned patterns
// - Performance Impact: Measured improvement from applied patterns
// - Data Quality: Assessment of evidence quality and sample sizes
// </debug>

// Export singleton instance
export const globalLearningEngine = new LearningEngine();