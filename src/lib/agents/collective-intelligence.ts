/**
 * Collective Intelligence System v2.0
 * 
 * Role Definition:
 * You are the Collective Intelligence coordinator responsible for enabling knowledge sharing, consensus building, and collaborative learning across all agents in the AuthorityPilot ecosystem.
 * 
 * Primary Objective:
 * Your main task is to facilitate cross-agent knowledge sharing, build collective wisdom, and enable agents to learn from each other's experiences while maintaining privacy and security.
 */

import { createClient } from '@/lib/supabase/server';
import { globalLearningEngine } from './learning-engine';
import { getGlobalCommunicationBus } from './communication';
import { AgentMessage, Learning, Context } from './types';
import { openai } from '@/lib/openai';

interface CollectiveKnowledge {
  id: string;
  domain: 'content' | 'engagement' | 'strategy' | 'analytics' | 'general';
  insight: string;
  evidence: KnowledgeEvidence[];
  consensus: ConsensusData;
  applicability: ApplicabilityScope;
  confidence: number;
  impact: ImpactMetrics;
  contributors: string[]; // Agent IDs
  createdAt: Date;
  lastUpdated: Date;
  version: number;
}

interface KnowledgeEvidence {
  sourceAgent: string;
  evidence: any;
  weight: number;
  confidence: number;
  context: Partial<Context>;
  timestamp: Date;
}

interface ConsensusData {
  agreementScore: number; // 0-1
  participatingAgents: string[];
  votingResults: {
    agree: number;
    disagree: number;
    abstain: number;
  };
  consolidatedInsight: string;
  conflictingViews?: ConflictingView[];
}

interface ConflictingView {
  viewpoint: string;
  supportingAgents: string[];
  evidence: any[];
  reasoning: string;
}

interface ApplicabilityScope {
  industries: string[];
  userTypes: string[];
  platforms: string[];
  contentTypes: string[];
  conditions: string[];
}

interface ImpactMetrics {
  adoptionRate: number; // How many agents use this knowledge
  successRate: number; // Success rate when applied
  performanceGain: number; // Average performance improvement
  riskLevel: 'low' | 'medium' | 'high';
}

interface KnowledgeRequest {
  id: string;
  requestingAgent: string;
  domain: string;
  query: string;
  context: Partial<Context>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface ConsensusSession {
  id: string;
  topic: string;
  initiatingAgent: string;
  participants: string[];
  proposedKnowledge: CollectiveKnowledge;
  discussionPoints: DiscussionPoint[];
  status: 'open' | 'voting' | 'completed' | 'failed';
  outcome?: CollectiveKnowledge;
  duration: number;
}

interface DiscussionPoint {
  agentId: string;
  point: string;
  evidence: any;
  stance: 'support' | 'oppose' | 'neutral' | 'conditional';
  reasoning: string;
  timestamp: Date;
}

export class CollectiveIntelligence {
  private knowledgeBase: Map<string, CollectiveKnowledge[]> = new Map();
  private activeSessions: Map<string, ConsensusSession> = new Map();
  private knowledgeRequests: Map<string, KnowledgeRequest> = new Map();
  private communicationBus = getGlobalCommunicationBus();
  private agentCapabilities: Map<string, string[]> = new Map();

  constructor() {
    this.initializeCollectiveIntelligence();
  }

  private async initializeCollectiveIntelligence() {
    console.log('🧠 Initializing Collective Intelligence System...');
    
    // Load existing collective knowledge
    await this.loadCollectiveKnowledge();
    
    // Initialize agent capabilities
    await this.initializeAgentCapabilities();
    
    // Setup communication handlers
    this.setupCommunicationHandlers();
    
    console.log('✅ Collective Intelligence System initialized');
  }

  async shareKnowledge(
    sourceAgent: string,
    learning: Learning,
    context: Context
  ): Promise<void> {
    console.log(`📤 Agent ${sourceAgent} sharing knowledge: ${learning.insight}`);

    try {
      // 1. Determine knowledge domain
      const domain = await this.classifyKnowledgeDomain(learning, context);
      
      // 2. Check if similar knowledge exists
      const existingKnowledge = await this.findSimilarKnowledge(domain, learning);
      
      if (existingKnowledge) {
        // 3a. Contribute to existing knowledge
        await this.contributeToKnowledge(existingKnowledge.id, sourceAgent, learning, context);
      } else {
        // 3b. Propose new collective knowledge
        await this.proposeNewKnowledge(sourceAgent, learning, context, domain);
      }

      // 4. Notify relevant agents
      await this.notifyRelevantAgents(domain, learning, context);

    } catch (error) {
      console.error('Knowledge sharing error:', error);
    }
  }

  private async classifyKnowledgeDomain(
    learning: Learning, 
    context: Context
  ): Promise<string> {
    const prompt = this.buildDomainClassificationPrompt(learning, context);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    try {
      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis.domain || 'general';
    } catch (error) {
      console.error('Domain classification failed:', error);
      return 'general';
    }
  }

  private buildDomainClassificationPrompt(
    learning: Learning, 
    context: Context
  ): string {
    return `Classify the following learning insight into the most appropriate domain for knowledge sharing.

Learning Insight: ${learning.insight}
Evidence: ${learning.evidence}
Context: ${JSON.stringify(context, null, 2)}
Applicability: ${learning.applicability}

Available Domains:
- content: Content creation, writing, messaging, voice matching
- engagement: Social interaction, relationship building, networking
- strategy: Business strategy, positioning, goal setting, planning
- analytics: Performance analysis, data interpretation, optimization
- general: Cross-cutting insights applicable to multiple domains

Respond with JSON:
{
  "domain": "content|engagement|strategy|analytics|general",
  "confidence": 0.95,
  "reasoning": "Explanation of classification decision"
}`;
  }

  async requestKnowledge(
    requestingAgent: string,
    query: string,
    context: Context,
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<CollectiveKnowledge[]> {
    console.log(`❓ Agent ${requestingAgent} requesting knowledge: ${query}`);

    const request: KnowledgeRequest = {
      id: `req_${Date.now()}_${requestingAgent}`,
      requestingAgent,
      domain: await this.inferDomainFromQuery(query),
      query,
      context,
      urgency,
      timestamp: new Date()
    };

    this.knowledgeRequests.set(request.id, request);

    // Search existing knowledge base
    const relevantKnowledge = await this.searchKnowledgeBase(query, context);

    // If urgent and no good matches, initiate consensus session
    if (urgency === 'critical' && relevantKnowledge.length === 0) {
      await this.initiateEmergencyConsensus(request);
    }

    return relevantKnowledge;
  }

  private async searchKnowledgeBase(
    query: string, 
    context: Context
  ): Promise<CollectiveKnowledge[]> {
    const allKnowledge = Array.from(this.knowledgeBase.values()).flat();
    
    // Use semantic search to find relevant knowledge
    const relevantKnowledge = await this.semanticSearch(query, allKnowledge, context);
    
    // Filter by applicability and confidence
    return relevantKnowledge.filter(k => 
      k.confidence > 0.6 && 
      this.isApplicableToContext(k, context)
    ).sort((a, b) => b.confidence - a.confidence);
  }

  private async semanticSearch(
    query: string,
    knowledge: CollectiveKnowledge[],
    context: Context
  ): Promise<CollectiveKnowledge[]> {
    // Simple keyword matching - could be enhanced with embeddings
    const queryWords = query.toLowerCase().split(' ');
    
    return knowledge.filter(k => {
      const insightWords = k.insight.toLowerCase().split(' ');
      const overlap = queryWords.filter(word => 
        insightWords.some(iWord => iWord.includes(word) || word.includes(iWord))
      ).length;
      
      return overlap >= Math.min(2, queryWords.length * 0.3);
    });
  }

  async initiateConsensus(
    initiatingAgent: string,
    proposedKnowledge: Partial<CollectiveKnowledge>,
    participantAgents?: string[]
  ): Promise<string> {
    const sessionId = `consensus_${Date.now()}_${initiatingAgent}`;
    
    const session: ConsensusSession = {
      id: sessionId,
      topic: proposedKnowledge.insight || 'Knowledge Validation',
      initiatingAgent,
      participants: participantAgents || await this.selectRelevantAgents(proposedKnowledge),
      proposedKnowledge: proposedKnowledge as CollectiveKnowledge,
      discussionPoints: [],
      status: 'open',
      duration: 0
    };

    this.activeSessions.set(sessionId, session);

    // Notify participants
    await this.notifyConsensusParticipants(session);

    console.log(`🗳️ Consensus session ${sessionId} initiated with ${session.participants.length} participants`);
    
    return sessionId;
  }

  private async selectRelevantAgents(
    proposedKnowledge: Partial<CollectiveKnowledge>
  ): Promise<string[]> {
    const domain = proposedKnowledge.domain;
    const relevantAgents: string[] = [];

    // Select agents based on domain expertise
    for (const [agentId, capabilities] of this.agentCapabilities.entries()) {
      if (capabilities.includes(domain || 'general')) {
        relevantAgents.push(agentId);
      }
    }

    // Ensure minimum participation
    if (relevantAgents.length < 3) {
      // Add orchestrator and other core agents
      ['orchestrator_agent', 'strategy_agent', 'analytics_agent'].forEach(agent => {
        if (!relevantAgents.includes(agent)) {
          relevantAgents.push(agent);
        }
      });
    }

    return relevantAgents.slice(0, 5); // Limit to 5 participants for efficiency
  }

  async participateInConsensus(
    sessionId: string,
    participantAgent: string,
    stance: 'support' | 'oppose' | 'neutral' | 'conditional',
    reasoning: string,
    evidence?: any
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'open') return;

    const discussionPoint: DiscussionPoint = {
      agentId: participantAgent,
      point: reasoning,
      evidence: evidence || {},
      stance,
      reasoning,
      timestamp: new Date()
    };

    session.discussionPoints.push(discussionPoint);

    // Check if all participants have responded
    const respondedAgents = new Set(session.discussionPoints.map(dp => dp.agentId));
    if (respondedAgents.size >= session.participants.length) {
      await this.finalizeConsensus(sessionId);
    }
  }

  private async finalizeConsensus(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'voting';

    // Analyze discussion points and calculate consensus
    const consensus = await this.calculateConsensus(session);
    
    if (consensus.agreementScore >= 0.7) {
      // Accept knowledge into collective base
      const finalKnowledge: CollectiveKnowledge = {
        ...session.proposedKnowledge,
        id: `knowledge_${Date.now()}`,
        consensus,
        contributors: session.participants,
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      };

      await this.addToKnowledgeBase(finalKnowledge);
      session.outcome = finalKnowledge;
      session.status = 'completed';

      console.log(`✅ Consensus reached: ${finalKnowledge.insight}`);
    } else {
      session.status = 'failed';
      console.log(`❌ No consensus reached for session ${sessionId}`);
    }

    // Notify participants of outcome
    await this.notifyConsensusOutcome(session);
  }

  private async calculateConsensus(session: ConsensusSession): Promise<ConsensusData> {
    const points = session.discussionPoints;
    const stances = points.map(p => p.stance);
    
    const votingResults = {
      agree: stances.filter(s => s === 'support').length,
      disagree: stances.filter(s => s === 'oppose').length,
      abstain: stances.filter(s => s === 'neutral').length
    };

    const totalVotes = votingResults.agree + votingResults.disagree + votingResults.abstain;
    const agreementScore = totalVotes > 0 ? (votingResults.agree + votingResults.abstain * 0.5) / totalVotes : 0;

    // Consolidate insights using AI
    const consolidatedInsight = await this.consolidateInsights(points);

    return {
      agreementScore,
      participatingAgents: session.participants,
      votingResults,
      consolidatedInsight: consolidatedInsight || session.proposedKnowledge.insight,
      conflictingViews: this.extractConflictingViews(points)
    };
  }

  private async consolidateInsights(points: DiscussionPoint[]): Promise<string> {
    const prompt = this.buildInsightConsolidationPrompt(points);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800
    });

    return response.choices[0].message.content || '';
  }

  private buildInsightConsolidationPrompt(points: DiscussionPoint[]): string {
    const discussionSummary = points.map(p => 
      `Agent ${p.agentId} (${p.stance}): ${p.reasoning}`
    ).join('\n');

    return `Consolidate the following discussion points into a single, refined insight that incorporates collective wisdom.

Discussion Points:
${discussionSummary}

Provide a consolidated insight that:
1. Identifies common themes across all perspectives
2. Integrates supporting evidence and reasoning
3. Addresses any conflicting viewpoints constructively
4. Synthesizes into a clear, actionable insight

Respond with JSON:
{
  "consolidated_insight": "Single, refined insight incorporating all perspectives",
  "key_themes": ["theme1", "theme2", "theme3"],
  "evidence_strength": 0.85,
  "confidence": 0.90,
  "caveats": ["any important limitations or conditions"]
}`;
  }

  async getCollectiveWisdom(
    domain: string,
    context?: Partial<Context>
  ): Promise<CollectiveKnowledge[]> {
    const domainKnowledge = this.knowledgeBase.get(domain) || [];
    
    if (context) {
      return domainKnowledge.filter(k => this.isApplicableToContext(k, context));
    }
    
    return domainKnowledge.sort((a, b) => b.confidence - a.confidence);
  }

  async getSystemInsights(): Promise<any> {
    const totalKnowledge = Array.from(this.knowledgeBase.values()).flat().length;
    const activeSessions = this.activeSessions.size;
    const pendingRequests = this.knowledgeRequests.size;
    
    const domainDistribution = Array.from(this.knowledgeBase.entries()).map(([domain, knowledge]) => ({
      domain,
      count: knowledge.length,
      avgConfidence: knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length
    }));

    return {
      totalKnowledge,
      activeSessions,
      pendingRequests,
      domainDistribution,
      recentActivity: await this.getRecentActivity(),
      topInsights: await this.getTopInsights()
    };
  }

  // Private helper methods
  private async loadCollectiveKnowledge(): Promise<void> {
    console.log('📚 Loading collective knowledge from database...');
    // Implementation would load from Supabase
  }

  private async initializeAgentCapabilities(): Promise<void> {
    // Map agent capabilities for consensus selection
    this.agentCapabilities.set('strategy_agent', ['strategy', 'general']);
    this.agentCapabilities.set('content_creator_agent', ['content', 'general']);
    this.agentCapabilities.set('engagement_agent', ['engagement', 'general']);
    this.agentCapabilities.set('analytics_agent', ['analytics', 'general']);
    this.agentCapabilities.set('orchestrator_agent', ['general', 'strategy', 'analytics']);
  }

  private setupCommunicationHandlers(): void {
    // Setup handlers for knowledge sharing messages
    this.communicationBus.subscribe('knowledge_share', async (message: AgentMessage) => {
      // Handle incoming knowledge sharing requests
    });

    this.communicationBus.subscribe('consensus_request', async (message: AgentMessage) => {
      // Handle consensus participation requests
    });
  }

  private async findSimilarKnowledge(domain: string, learning: Learning): Promise<CollectiveKnowledge | null> {
    const domainKnowledge = this.knowledgeBase.get(domain) || [];
    
    for (const knowledge of domainKnowledge) {
      const similarity = this.calculateInsightSimilarity(knowledge.insight, learning.insight);
      if (similarity > 0.8) {
        return knowledge;
      }
    }
    
    return null;
  }

  private calculateInsightSimilarity(insight1: string, insight2: string): number {
    // Simple similarity calculation - could be enhanced with embeddings
    const words1 = new Set(insight1.toLowerCase().split(' '));
    const words2 = new Set(insight2.toLowerCase().split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async contributeToKnowledge(
    knowledgeId: string,
    contributor: string,
    learning: Learning,
    context: Context
  ): Promise<void> {
    // Find and update existing knowledge
    for (const [domain, knowledgeList] of this.knowledgeBase.entries()) {
      const knowledge = knowledgeList.find(k => k.id === knowledgeId);
      if (knowledge) {
        knowledge.evidence.push({
          sourceAgent: contributor,
          evidence: learning.evidence,
          weight: 1.0,
          confidence: learning.confidence,
          context,
          timestamp: new Date()
        });
        
        knowledge.contributors.push(contributor);
        knowledge.lastUpdated = new Date();
        knowledge.version++;
        
        // Recalculate confidence
        knowledge.confidence = this.recalculateKnowledgeConfidence(knowledge);
        break;
      }
    }
  }

  private recalculateKnowledgeConfidence(knowledge: CollectiveKnowledge): number {
    const evidenceWeights = knowledge.evidence.map(e => e.confidence * e.weight);
    const totalWeight = knowledge.evidence.reduce((sum, e) => sum + e.weight, 0);
    
    if (totalWeight === 0) return 0;
    
    const weightedConfidence = evidenceWeights.reduce((sum, w) => sum + w, 0) / totalWeight;
    const consensusBonus = knowledge.consensus.agreementScore * 0.2;
    
    return Math.min(1, weightedConfidence + consensusBonus);
  }

  private async proposeNewKnowledge(
    sourceAgent: string,
    learning: Learning,
    context: Context,
    domain: string
  ): Promise<void> {
    const proposedKnowledge: Partial<CollectiveKnowledge> = {
      domain: domain as any,
      insight: learning.insight,
      evidence: [{
        sourceAgent,
        evidence: learning.evidence,
        weight: 1.0,
        confidence: learning.confidence,
        context,
        timestamp: new Date()
      }],
      applicability: this.inferApplicabilityScope(learning, context),
      confidence: learning.confidence,
      contributors: [sourceAgent]
    };

    // Initiate consensus session
    await this.initiateConsensus(sourceAgent, proposedKnowledge);
  }

  private inferApplicabilityScope(learning: Learning, context: Context): ApplicabilityScope {
    return {
      industries: context.userProfile?.industry ? [context.userProfile.industry] : ['general'],
      userTypes: ['all'],
      platforms: ['all'],
      contentTypes: ['all'],
      conditions: [learning.applicability || 'general']
    };
  }

  private isApplicableToContext(knowledge: CollectiveKnowledge, context: Partial<Context>): boolean {
    const scope = knowledge.applicability;
    
    // Check industry applicability
    if (context.userProfile?.industry && scope.industries.length > 0) {
      if (!scope.industries.includes('general') && !scope.industries.includes(context.userProfile.industry)) {
        return false;
      }
    }
    
    return true;
  }

  private async notifyRelevantAgents(domain: string, learning: Learning, context: Context): Promise<void> {
    // Implementation would send notifications through communication bus
  }

  private async notifyConsensusParticipants(session: ConsensusSession): Promise<void> {
    // Implementation would notify participants of consensus session
  }

  private async notifyConsensusOutcome(session: ConsensusSession): Promise<void> {
    // Implementation would notify participants of consensus outcome
  }

  private async addToKnowledgeBase(knowledge: CollectiveKnowledge): Promise<void> {
    const domainKnowledge = this.knowledgeBase.get(knowledge.domain) || [];
    domainKnowledge.push(knowledge);
    this.knowledgeBase.set(knowledge.domain, domainKnowledge);
    
    // Persist to database
    await this.persistKnowledge(knowledge);
  }

  private async persistKnowledge(knowledge: CollectiveKnowledge): Promise<void> {
    console.log(`💾 Persisting collective knowledge: ${knowledge.id}`);
    // Implementation would save to Supabase
  }

  private extractConflictingViews(points: DiscussionPoint[]): ConflictingView[] {
    const opposing = points.filter(p => p.stance === 'oppose');
    
    return opposing.map(point => ({
      viewpoint: point.reasoning,
      supportingAgents: [point.agentId],
      evidence: [point.evidence],
      reasoning: point.reasoning
    }));
  }

  private async initiateEmergencyConsensus(request: KnowledgeRequest): Promise<void> {
    // Implementation for urgent knowledge requests
    console.log(`🚨 Emergency consensus initiated for: ${request.query}`);
  }

  private async inferDomainFromQuery(query: string): Promise<string> {
    // Simple domain inference - could be enhanced with ML
    const keywords = {
      content: ['content', 'writing', 'post', 'article', 'copy'],
      engagement: ['engagement', 'comment', 'reply', 'relationship', 'network'],
      strategy: ['strategy', 'goal', 'plan', 'position', 'brand'],
      analytics: ['analytics', 'performance', 'metrics', 'data', 'analysis']
    };

    const queryLower = query.toLowerCase();
    
    for (const [domain, words] of Object.entries(keywords)) {
      if (words.some(word => queryLower.includes(word))) {
        return domain;
      }
    }
    
    return 'general';
  }

  private async getRecentActivity(): Promise<any[]> {
    // Return recent knowledge sharing activity
    return [];
  }

  private async getTopInsights(): Promise<any[]> {
    // Return top-performing insights
    return [];
  }
}

// Export singleton instance
export const globalCollectiveIntelligence = new CollectiveIntelligence();