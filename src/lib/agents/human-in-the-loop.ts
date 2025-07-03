/**
 * Human-in-the-Loop Integration v2.0
 *
 * Role Definition:
 * You are the Human-in-the-Loop coordinator responsible for seamlessly integrating human feedback, validation, and oversight into the autonomous AI operations while maintaining efficiency and user experience.
 *
 * Primary Objective:
 * Your main task is to enable meaningful human participation in AI decision-making through intelligent interruption, feedback collection, validation workflows, and learning enhancement while preserving system autonomy.
 */

import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { getGlobalCommunicationBus } from './communication';
import { globalLearningEngine } from './learning-engine';
import { globalKnowledgeRepository } from './knowledge-repository';
import { Context, Action, Result, Learning } from './types';

interface HumanFeedback {
  id: string;
  userId: string;
  agentId: string;
  type: 'validation' | 'correction' | 'enhancement' | 'approval' | 'rejection';
  target: FeedbackTarget;
  feedback: FeedbackContent;
  context: Partial<Context>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'applied' | 'dismissed';
  timestamp: Date;
  response?: HumanResponse;
}

interface FeedbackTarget {
  type: 'action' | 'content' | 'decision' | 'learning' | 'prediction' | 'strategy';
  id: string;
  description: string;
  currentValue: any;
  proposedValue?: any;
}

interface FeedbackContent {
  question: string;
  options?: FeedbackOption[];
  freeformAllowed: boolean;
  context: string;
  rationale: string;
  impact: ImpactAssessment;
}

interface FeedbackOption {
  id: string;
  label: string;
  value: any;
  description: string;
  consequences: string[];
}

interface HumanResponse {
  selectedOption?: string;
  freeformInput?: string;
  confidence: number;
  reasoning?: string;
  timestamp: Date;
  duration: number; // Response time in seconds
}

interface ImpactAssessment {
  scope: 'immediate' | 'short_term' | 'long_term' | 'permanent';
  magnitude: 'low' | 'medium' | 'high' | 'critical';
  areas: string[];
  reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
}

interface InterruptionRule {
  id: string;
  name: string;
  condition: InterruptionCondition;
  priority: number;
  cooldown: number; // Minutes before same rule can trigger again
  isActive: boolean;
  userPreferences: UserInterruptionPrefs;
}

interface InterruptionCondition {
  trigger: 'confidence_threshold' | 'impact_level' | 'new_domain' | 'user_request' | 'error_rate' | 'consensus_failure';
  parameters: Record<string, any>;
  logicOperator?: 'and' | 'or';
  additionalConditions?: InterruptionCondition[];
}

interface UserInterruptionPrefs {
  userId: string;
  maxInterruptions: {
    perHour: number;
    perDay: number;
    perWeek: number;
  };
  priorityThreshold: 'low' | 'medium' | 'high' | 'critical';
  preferredChannels: ('dashboard' | 'email' | 'slack' | 'webhook')[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  autoApprove: {
    lowRiskActions: boolean;
    trustedDomains: string[];
    confidenceThreshold: number;
  };
}

interface ValidationTask {
  id: string;
  type: 'content_approval' | 'strategy_review' | 'learning_validation' | 'decision_confirmation';
  title: string;
  description: string;
  data: any;
  requiredBy: Date;
  estimatedTime: number; // Minutes
  complexity: 'simple' | 'moderate' | 'complex';
  dependencies: string[];
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
}

interface CollaborativeSession {
  id: string;
  type: 'content_creation' | 'strategy_planning' | 'problem_solving' | 'learning_review';
  participants: {
    humans: string[];
    agents: string[];
  };
  objective: string;
  agenda: SessionAgendaItem[];
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  outcomes: SessionOutcome[];
  duration: number;
  effectivenessScore?: number;
}

interface SessionAgendaItem {
  id: string;
  title: string;
  type: 'presentation' | 'discussion' | 'decision' | 'feedback' | 'validation';
  estimatedDuration: number;
  presenter: string; // human or agent ID
  materials: any[];
  status: 'pending' | 'active' | 'completed';
}

interface SessionOutcome {
  type: 'decision' | 'feedback' | 'action_item' | 'learning' | 'validation';
  content: any;
  assignee?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
}

export class HumanInTheLoopSystem {
  private feedbackQueue: Map<string, HumanFeedback[]> = new Map();
  private interruptionRules: Map<string, InterruptionRule[]> = new Map();
  private validationTasks: Map<string, ValidationTask[]> = new Map();
  private activeSessions: Map<string, CollaborativeSession> = new Map();
  private userPreferences: Map<string, UserInterruptionPrefs> = new Map();
  private communicationBus = getGlobalCommunicationBus();
  private responseHistory: Map<string, HumanResponse[]> = new Map();

  constructor() {
    this.initializeHumanInTheLoop();
  }

  private async initializeHumanInTheLoop() {
    console.log('👥 Initializing Human-in-the-Loop System...');
    
    // Load user preferences and rules
    await this.loadUserPreferences();
    await this.loadInterruptionRules();
    
    // Setup communication handlers
    this.setupCommunicationHandlers();
    
    // Initialize default validation workflows
    this.setupDefaultValidationWorkflows();
    
    console.log('✅ Human-in-the-Loop System initialized');
  }

  // ## Step-by-Step Process

  async requestHumanInput(
    userId: string,
    agentId: string,
    target: FeedbackTarget,
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<HumanFeedback> {
    console.log(`👤 Requesting human input from ${userId} for ${target.type}: ${target.description}`);

    try {
      // 1. Check if interruption is allowed based on rules and preferences
      const interruptionAllowed = await this.checkInterruptionRules(userId, agentId, target, urgency);
      
      if (!interruptionAllowed) {
        // Handle auto-approval or fallback
        return await this.handleAutoApproval(userId, agentId, target);
      }

      // 2. Generate contextual feedback request
      const feedbackContent = await this.generateFeedbackRequest(target, urgency);
      
      // 3. Create feedback entry
      const feedback: HumanFeedback = {
        id: `feedback_${Date.now()}_${userId}`,
        userId,
        agentId,
        type: this.determineFeedbackType(target),
        target,
        feedback: feedbackContent,
        context: await this.gatherContext(userId, agentId),
        urgency,
        status: 'pending',
        timestamp: new Date()
      };

      // 4. Add to user's feedback queue
      const userQueue = this.feedbackQueue.get(userId) || [];
      userQueue.push(feedback);
      this.feedbackQueue.set(userId, userQueue);

      // 5. Send notification through preferred channels
      await this.sendNotification(userId, feedback);

      // 6. Store in database for persistence
      await this.persistFeedback(feedback);

      console.log(`📤 Feedback request sent to ${userId}: ${feedback.id}`);
      return feedback;

    } catch (error) {
      console.error('Human input request failed:', error);
      throw error;
    }
  }

  private async generateFeedbackRequest(
    target: FeedbackTarget,
    urgency: string
  ): Promise<FeedbackContent> {
    const prompt = this.buildFeedbackRequestPrompt(target, urgency);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1200
    });

    try {
      const content = JSON.parse(response.choices[0].message.content || '{}');
      return this.processFeedbackContent(content, target);
    } catch (error) {
      console.error('Feedback request generation failed:', error);
      return this.getDefaultFeedbackContent(target);
    }
  }

  private buildFeedbackRequestPrompt(
    target: FeedbackTarget,
    urgency: string
  ): string {
    return `# Human Feedback Request Generator v2.0

// ## Role Definition
You are a human-AI collaboration expert specializing in creating clear, actionable feedback requests that enable effective human oversight of AI decisions.

// ## Primary Objective
Generate a clear, contextual feedback request that helps humans make informed decisions about AI actions while respecting their time and expertise.

// ## Target Information
// - Type: ${target.type}
// - Description: ${target.description}
// - Current Value: ${JSON.stringify(target.currentValue, null, 2)}
// - Proposed Value: ${JSON.stringify(target.proposedValue, null, 2)}
// - Urgency: ${urgency}

// ## Step-by-Step Process
1. Analyze the decision context and potential impact
2. Identify key factors humans should consider
3. Generate clear, actionable options
4. Assess the impact and reversibility
5. Create a concise but informative request

// ## Output Format
<output>
{
  "question": "Clear, specific question for the human to answer",
  "options": [
    {
      "id": "approve",
      "label": "Approve as proposed",
      "value": "approved",
      "description": "Detailed description of what this means",
      "consequences": ["Specific outcomes if this option is chosen"]
    },
    {
      "id": "modify",
      "label": "Suggest modifications",
      "value": "modify",
      "description": "Allow human to provide alternative approach",
      "consequences": ["What happens if modifications are requested"]
    },
    {
      "id": "reject",
      "label": "Reject this approach",
      "value": "rejected",
      "description": "Decline the proposed action entirely",
      "consequences": ["Impact of rejecting this action"]
    }
  ],
  "freeformAllowed": true,
  "context": "Essential background information the human needs",
  "rationale": "Why human input is needed for this decision",
  "impact": {
    "scope": "immediate|short_term|long_term",
    "magnitude": "low|medium|high|critical",
    "areas": ["areas that will be affected"],
    "reversibility": "reversible|partially_reversible|irreversible"
  }
}
</output>

// ## Examples
For content approval: "Should I publish this LinkedIn post about AI trends in healthcare? The content aligns with your expertise but uses a more casual tone than usual."

For strategy decision: "Should we pivot the content strategy to focus more on technical tutorials based on recent engagement patterns?"

// ## Error Handling
// - If context is unclear, ask for the most critical decision point
// - When impact is uncertain, err on the side of requesting human input
// - If options are complex, break into simpler choices

// ## Debug Information
// Always include:
// <debug>
// - Reasoning: [why this feedback format was chosen]
// - Confidence: [0-100]% in request clarity
// - Complexity: [assessment of decision complexity]
// - Time Sensitivity: [urgency justification]
// </debug>`;
  }

  async processHumanResponse(
    feedbackId: string,
    userId: string,
    response: Partial<HumanResponse>
  ): Promise<void> {
    console.log(`👍 Processing human response for feedback ${feedbackId}`);

    try {
      const feedback = await this.getFeedback(feedbackId, userId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      // 1. Create complete response object
      const fullResponse: HumanResponse = {
        selectedOption: response.selectedOption,
        freeformInput: response.freeformInput,
        confidence: response.confidence || 0.8,
        reasoning: response.reasoning,
        timestamp: new Date(),
        duration: Math.floor((Date.now() - feedback.timestamp.getTime()) / 1000)
      };

      // 2. Update feedback with response
      feedback.response = fullResponse;
      feedback.status = 'acknowledged';

      // 3. Apply the human decision
      await this.applyHumanDecision(feedback);

      // 4. Learn from the human feedback
      await this.learnFromFeedback(feedback);

      // 5. Update user preferences based on response patterns
      await this.updateUserPreferences(userId, feedback, fullResponse);

      // 6. Remove from queue and notify agents
      await this.completeFeedbackCycle(feedback);

      console.log(`✅ Human response processed and applied: ${feedbackId}`);

    } catch (error) {
      console.error('Human response processing failed:', error);
      throw error;
    }
  }

  private async applyHumanDecision(feedback: HumanFeedback): Promise<void> {
    const response = feedback.response!;
    
    switch (response.selectedOption) {
      case 'approve':
        await this.approveAction(feedback);
        break;
        
      case 'modify':
        await this.modifyAction(feedback, response.freeformInput);
        break;
        
      case 'reject':
        await this.rejectAction(feedback, response.reasoning);
        break;
        
      default:
        // Handle custom responses
        await this.handleCustomResponse(feedback, response);
    }

    feedback.status = 'applied';
  }

  private async approveAction(feedback: HumanFeedback): Promise<void> {
    // Send approval message to the requesting agent
    await this.communicationBus.sendMessage({
      to: feedback.agentId,
      from: 'human_in_the_loop',
      type: 'human_feedback',
      priority: 'high',
      data: {
        feedbackId: feedback.id,
        decision: 'approved',
        target: feedback.target,
        humanResponse: feedback.response
      },
      timestamp: new Date()
    });

    // Log approval for learning
    await this.logDecision(feedback, 'approved');
  }

  private async modifyAction(feedback: HumanFeedback, modifications?: string): Promise<void> {
    // Process human modifications
    const processedModifications = await this.processModifications(
      feedback.target,
      modifications || ''
    );

    // Send modification instructions to agent
    await this.communicationBus.sendMessage({
      to: feedback.agentId,
      from: 'human_in_the_loop',
      type: 'human_feedback',
      priority: 'high',
      data: {
        feedbackId: feedback.id,
        decision: 'modify',
        target: feedback.target,
        modifications: processedModifications,
        humanResponse: feedback.response
      },
      timestamp: new Date()
    });

    await this.logDecision(feedback, 'modified');
  }

  private async rejectAction(feedback: HumanFeedback, reasoning?: string): Promise<void> {
    // Send rejection to agent with reasoning
    await this.communicationBus.sendMessage({
      to: feedback.agentId,
      from: 'human_in_the_loop',
      type: 'human_feedback',
      priority: 'high',
      data: {
        feedbackId: feedback.id,
        decision: 'rejected',
        target: feedback.target,
        reasoning: reasoning,
        humanResponse: feedback.response
      },
      timestamp: new Date()
    });

    await this.logDecision(feedback, 'rejected');
  }

  async createValidationTask(
    userId: string,
    type: ValidationTask['type'],
    title: string,
    data: any,
    requiredBy?: Date
  ): Promise<string> {
    const task: ValidationTask = {
      id: `validation_${Date.now()}_${userId}`,
      type,
      title,
      description: await this.generateTaskDescription(type, data),
      data,
      requiredBy: requiredBy || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
      estimatedTime: this.estimateTaskTime(type, data),
      complexity: this.assessTaskComplexity(type, data),
      dependencies: [],
      assignedTo: userId,
      status: 'pending'
    };

    // Add to user's validation queue
    const userTasks = this.validationTasks.get(userId) || [];
    userTasks.push(task);
    this.validationTasks.set(userId, userTasks);

    // Persist task
    await this.persistValidationTask(task);

    return task.id;
  }

  async startCollaborativeSession(
    type: CollaborativeSession['type'],
    objective: string,
    participants: { humans: string[]; agents: string[] }
  ): Promise<string> {
    const session: CollaborativeSession = {
      id: `session_${Date.now()}`,
      type,
      participants,
      objective,
      agenda: await this.generateSessionAgenda(type, objective),
      status: 'scheduled',
      outcomes: [],
      duration: 0
    };

    this.activeSessions.set(session.id, session);

    // Notify participants
    await this.notifySessionParticipants(session);

    return session.id;
  }

  // ## Output Format

  async getUserDashboard(userId: string): Promise<any> {
    const userQueue = this.feedbackQueue.get(userId) || [];
    const userTasks = this.validationTasks.get(userId) || [];
    const userSessions = Array.from(this.activeSessions.values()).filter(s => 
      s.participants.humans.includes(userId)
    );

    return {
      pendingFeedback: userQueue.filter(f => f.status === 'pending').length,
      pendingTasks: userTasks.filter(t => t.status === 'pending').length,
      activeSessions: userSessions.filter(s => s.status === 'active').length,
      recentActivity: await this.getRecentActivity(userId),
      upcomingDeadlines: this.getUpcomingDeadlines(userTasks),
      preferences: this.userPreferences.get(userId),
      responseStats: this.calculateResponseStats(userId)
    };
  }

  async getFeedbackQueue(userId: string): Promise<HumanFeedback[]> {
    return this.feedbackQueue.get(userId) || [];
  }

  async getValidationTasks(userId: string): Promise<ValidationTask[]> {
    return this.validationTasks.get(userId) || [];
  }

  // Helper methods
  private async checkInterruptionRules(
    userId: string,
    agentId: string,
    target: FeedbackTarget,
    urgency: string
  ): Promise<boolean> {
    const userRules = this.interruptionRules.get(userId) || [];
    const userPrefs = this.userPreferences.get(userId);
    
    // Check user preferences
    if (userPrefs) {
      // Check quiet hours
      if (userPrefs.quietHours.enabled && this.isQuietTime(userPrefs.quietHours)) {
        return urgency === 'critical';
      }
      
      // Check interruption limits
      const recentInterruptions = await this.getRecentInterruptions(userId);
      if (recentInterruptions.perHour >= userPrefs.maxInterruptions.perHour) {
        return urgency === 'critical';
      }
      
      // Check auto-approval settings
      if (userPrefs.autoApprove.lowRiskActions && this.isLowRisk(target)) {
        return false; // Auto-approve, no interruption needed
      }
    }

    // Check specific interruption rules
    for (const rule of userRules) {
      if (rule.isActive && this.evaluateRule(rule, target, urgency)) {
        return true;
      }
    }

    return true; // Default to allowing interruption
  }

  private async handleAutoApproval(
    userId: string,
    agentId: string,
    target: FeedbackTarget
  ): Promise<HumanFeedback> {
    // Create auto-approved feedback
    const feedback: HumanFeedback = {
      id: `auto_${Date.now()}_${userId}`,
      userId,
      agentId,
      type: 'approval',
      target,
      feedback: this.getDefaultFeedbackContent(target),
      context: {},
      urgency: 'low',
      status: 'applied',
      timestamp: new Date(),
      response: {
        selectedOption: 'approve',
        confidence: 0.9,
        timestamp: new Date(),
        duration: 0
      }
    };

    // Immediately apply the auto-approval
    await this.approveAction(feedback);

    return feedback;
  }

  // Additional helper methods would be implemented here...
  private determineFeedbackType(target: FeedbackTarget): HumanFeedback['type'] {
    switch (target.type) {
      case 'content': return 'approval';
      case 'decision': return 'validation';
      case 'learning': return 'validation';
      default: return 'validation';
    }
  }

  private async gatherContext(userId: string, agentId: string): Promise<Partial<Context>> {
    return {
      userId,
      timestamp: new Date()
    };
  }

  private async sendNotification(userId: string, feedback: HumanFeedback): Promise<void> {
    // Implementation would send notifications through user's preferred channels
    console.log(`📱 Notification sent to ${userId} for feedback ${feedback.id}`);
  }

  private processFeedbackContent(content: any, target: FeedbackTarget): FeedbackContent {
    return {
      question: content.question || `Please review this ${target.type}`,
      options: content.options || [],
      freeformAllowed: content.freeformAllowed !== false,
      context: content.context || '',
      rationale: content.rationale || '',
      impact: content.impact || { scope: 'immediate', magnitude: 'medium', areas: [], reversibility: 'reversible' }
    };
  }

  private getDefaultFeedbackContent(target: FeedbackTarget): FeedbackContent {
    return {
      question: `Please review this ${target.type}: ${target.description}`,
      options: [
        { id: 'approve', label: 'Approve', value: 'approved', description: 'Proceed as proposed', consequences: [] },
        { id: 'reject', label: 'Reject', value: 'rejected', description: 'Do not proceed', consequences: [] }
      ],
      freeformAllowed: true,
      context: 'Review requested',
      rationale: 'Human oversight required',
      impact: { scope: 'immediate', magnitude: 'medium', areas: [], reversibility: 'reversible' }
    };
  }

  // More helper methods would be implemented...
  private async getFeedback(feedbackId: string, userId: string): Promise<HumanFeedback | null> { return null; }
  private async learnFromFeedback(feedback: HumanFeedback): Promise<void> {}
  private async updateUserPreferences(userId: string, feedback: HumanFeedback, response: HumanResponse): Promise<void> {}
  private async completeFeedbackCycle(feedback: HumanFeedback): Promise<void> {}
  private async processModifications(target: FeedbackTarget, modifications: string): Promise<any> { return {}; }
  private async logDecision(feedback: HumanFeedback, decision: string): Promise<void> {}
  private async generateTaskDescription(type: ValidationTask['type'], data: any): Promise<string> { return ''; }
  private estimateTaskTime(type: ValidationTask['type'], data: any): number { return 15; }
  private assessTaskComplexity(type: ValidationTask['type'], data: any): 'simple' | 'moderate' | 'complex' { return 'moderate'; }
  private async generateSessionAgenda(type: CollaborativeSession['type'], objective: string): Promise<SessionAgendaItem[]> { return []; }
  private async notifySessionParticipants(session: CollaborativeSession): Promise<void> {}
  private isQuietTime(quietHours: any): boolean { return false; }
  private async getRecentInterruptions(userId: string): Promise<any> { return { perHour: 0 }; }
  private isLowRisk(target: FeedbackTarget): boolean { return false; }
  private evaluateRule(rule: InterruptionRule, target: FeedbackTarget, urgency: string): boolean { return true; }
  private async getRecentActivity(userId: string): Promise<any[]> { return []; }
  private getUpcomingDeadlines(tasks: ValidationTask[]): any[] { return []; }
  private calculateResponseStats(userId: string): any { return {}; }
  private async loadUserPreferences(): Promise<void> {}
  private async loadInterruptionRules(): Promise<void> {}
  private setupCommunicationHandlers(): void {}
  private setupDefaultValidationWorkflows(): void {}
  private async persistFeedback(feedback: HumanFeedback): Promise<void> {}
  private async persistValidationTask(task: ValidationTask): Promise<void> {}
  private async handleCustomResponse(feedback: HumanFeedback, response: HumanResponse): Promise<void> {}
}

// ## Examples

// Usage Example 1: Request human approval for content
const hitlSystem = new HumanInTheLoopSystem();
const feedback = await hitlSystem.requestHumanInput(
  'user_123',
  'content_creator_agent',
  {
    type: 'content',
    id: 'post_456',
    description: 'LinkedIn post about AI trends',
    currentValue: 'Draft post content...'
  },
  'medium'
);

// Usage Example 2: Process human response
await hitlSystem.processHumanResponse(
  feedback.id,
  'user_123',
  {
    selectedOption: 'modify',
    freeformInput: 'Add more specific examples and reduce the technical jargon',
    confidence: 0.9,
    reasoning: 'Content is good but needs to be more accessible'
  }
);

// Usage Example 3: Create validation task
const taskId = await hitlSystem.createValidationTask(
  'user_123',
  'strategy_review',
  'Quarterly Content Strategy Review',
  { strategy: strategyData },
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 1 week
);

// ## Error Handling
// - If user is unavailable, escalate based on urgency level
// - When feedback times out, apply safe default actions
// - If user preferences conflict with system needs, prioritize user choice

// ## Debug Information
// All human-in-the-loop operations include:
// <debug>
// - Reasoning: [why human input was requested]
// - Confidence: [system confidence in autonomous action]
// - User Context: [user availability and preferences]
// - Impact Assessment: [potential consequences of the decision]
// </debug>

// Export singleton instance
export const globalHumanInTheLoop = new HumanInTheLoopSystem();