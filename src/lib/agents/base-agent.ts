import { 
  Agent, 
  AgentMemory, 
  AgentStatus, 
  Tool, 
  Context, 
  Observation, 
  Thought, 
  Plan, 
  Action, 
  Result, 
  Learning,
  Experience,
  CommunicationProtocol,
  AgentMessage,
  LongTermMemory,
  EpisodicMemory,
  SemanticMemory
} from './types';
import { getCurrentContext } from '@/lib/openai';

export abstract class BaseAgent implements Agent {
  public id: string;
  public name: string;
  public role: string;
  public capabilities: string[];
  public memory: AgentMemory;
  public tools: Tool[];
  public isActive: boolean = false;
  
  private communicationProtocol?: CommunicationProtocol;
  private performanceMetrics = {
    tasksCompleted: 0,
    successRate: 0,
    totalResponseTime: 0,
    errors: [] as string[],
    warnings: [] as string[]
  };

  constructor(config: {
    id: string;
    name: string;
    role: string;
    capabilities: string[];
    tools?: Tool[];
  }) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.capabilities = config.capabilities;
    this.tools = config.tools || [];
    this.memory = this.initializeMemory();
  }

  private initializeMemory(): AgentMemory {
    return {
      shortTerm: new Map(),
      longTerm: {
        store: new Map(),
        connections: new Map(),
        importance: new Map(),
        lastAccessed: new Map()
      } as LongTermMemory,
      episodic: {
        experiences: [],
        patterns: [],
        successCases: [],
        failureCases: []
      } as EpisodicMemory,
      semantic: {
        concepts: new Map(),
        relationships: new Map(),
        rules: [],
        strategies: []
      } as SemanticMemory
    };
  }

  // Core cognitive cycle implementation
  public async executeTask(context: Context): Promise<{
    actions: Action[];
    results: Result[];
    learnings: Learning[];
  }> {
    try {
      const startTime = Date.now();
      
      // Perception phase
      const observations = await this.perceive(context);
      this.updateShortTermMemory('currentObservations', observations);
      
      // Thinking phase
      const thoughts = await this.think(observations);
      this.updateShortTermMemory('currentThoughts', thoughts);
      
      // Planning phase
      const plan = await this.plan(thoughts);
      this.updateShortTermMemory('currentPlan', plan);
      
      // Action phase
      const actions = await this.act(plan);
      
      // Execute actions and collect results
      const results = await this.executeActions(actions);
      
      // Reflection phase
      const learnings = await this.reflect(actions, results);
      
      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(actions, results, responseTime);
      
      // Store experience in episodic memory
      const experience = {
        id: `exp_${Date.now()}`,
        type: 'task_execution',
        context,
        actions,
        results,
        learnings,
        timestamp: new Date(),
        success: results.every(r => r.success),
        tags: [this.role, context.userId]
      };
      
      await this.storeExperience(experience);
      
      // Integrate with learning systems
      await this.integrateWithLearningSystems(experience, learnings);

      return { actions, results, learnings };
    } catch (error) {
      this.performanceMetrics.errors.push(`Task execution error: ${error}`);
      throw error;
    }
  }

  private async integrateWithLearningSystems(experience: any, learnings: Learning[]): Promise<void> {
    try {
      // Import learning systems dynamically to avoid circular dependencies
      const { globalLearningEngine } = await import('./learning-engine');
      const { globalPatternRecognition } = await import('./pattern-recognition');
      const { globalCollectiveIntelligence } = await import('./collective-intelligence');
      const { globalHumanInTheLoop } = await import('./human-in-the-loop');
      
      // Feed experience to learning engine
      const additionalLearnings = await globalLearningEngine.learnFromExperience(this.id, experience);
      
      // Analyze patterns
      await globalPatternRecognition.analyzeExperience(this.id, experience);
      
      // Share significant learnings with collective intelligence
      for (const learning of [...learnings, ...additionalLearnings]) {
        if (learning.confidence > 0.8) { // Only share high-confidence learnings
          await globalCollectiveIntelligence.shareKnowledge(this.id, learning, experience.context);
        }
      }
      
      // Check if human oversight is needed for this experience
      await this.checkHumanOversightNeeds(experience, learnings);
      
    } catch (error) {
      console.error('Learning system integration error:', error);
      // Don't throw - learning integration failures shouldn't break agent execution
    }
  }

  private async checkHumanOversightNeeds(experience: any, learnings: Learning[]): Promise<void> {
    // Check if this experience warrants human attention
    const needsOversight = this.evaluateOversightNeeds(experience, learnings);
    
    if (needsOversight.required) {
      try {
        const { globalHumanInTheLoop } = await import('./human-in-the-loop');
        
        await globalHumanInTheLoop.requestHumanInput(
          experience.context.userId || 'system',
          this.id,
          {
            type: 'learning',
            id: experience.id,
            description: `Agent learning from ${experience.type}: ${needsOversight.reason}`,
            currentValue: {
              experience: this.summarizeExperience(experience),
              learnings: learnings.map(l => ({ insight: l.insight, confidence: l.confidence }))
            }
          },
          needsOversight.urgency
        );
      } catch (error) {
        console.error('Human oversight request failed:', error);
      }
    }
  }

  private evaluateOversightNeeds(experience: any, learnings: Learning[]): {
    required: boolean;
    reason?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Check for conditions that warrant human oversight
    
    // High-impact learnings
    const highImpactLearnings = learnings.filter(l => l.confidence > 0.9);
    if (highImpactLearnings.length > 0) {
      return {
        required: true,
        reason: `Discovered ${highImpactLearnings.length} high-confidence insights`,
        urgency: 'medium'
      };
    }
    
    // Failed actions with significant consequences
    const failedActions = experience.results?.filter(r => r.status === 'failed') || [];
    if (failedActions.length > 2) {
      return {
        required: true,
        reason: `Multiple action failures detected (${failedActions.length})`,
        urgency: 'high'
      };
    }
    
    // Unexpected outcomes
    if (experience.results?.some(r => r.unexpected === true)) {
      return {
        required: true,
        reason: 'Unexpected outcomes detected',
        urgency: 'medium'
      };
    }
    
    // Low-confidence but high-impact decisions
    const lowConfidenceHighImpact = learnings.filter(l => 
      l.confidence < 0.6 && l.applicability === 'high_impact'
    );
    if (lowConfidenceHighImpact.length > 0) {
      return {
        required: true,
        reason: 'Low-confidence but potentially high-impact learnings',
        urgency: 'low'
      };
    }
    
    return { required: false };
  }

  private summarizeExperience(experience: any): string {
    const actionCount = experience.actions?.length || 0;
    const successCount = experience.results?.filter(r => r.status === 'completed').length || 0;
    const learningCount = experience.learnings?.length || 0;
    
    return `Executed ${actionCount} actions with ${successCount} successes, generated ${learningCount} learnings`;
  }

  // Abstract methods to be implemented by specific agents
  public abstract perceive(context: Context): Promise<Observation[]>;
  public abstract think(observations: Observation[]): Promise<Thought[]>;
  public abstract plan(thoughts: Thought[]): Promise<Plan>;
  public abstract act(plan: Plan): Promise<Action[]>;
  public abstract reflect(actions: Action[], results: Result[]): Promise<Learning[]>;

  // Default implementations for common functionality
  protected async executeActions(actions: Action[]): Promise<Result[]> {
    const results: Result[] = [];
    
    for (const action of actions) {
      try {
        const tool = this.tools.find(t => t.name === action.type);
        if (!tool) {
          results.push({
            actionId: action.id,
            success: false,
            error: `Tool not found: ${action.type}`,
            timestamp: new Date()
          });
          continue;
        }

        const result = await tool.execute(action.parameters);
        results.push({
          actionId: action.id,
          success: true,
          data: result,
          timestamp: new Date(),
          metrics: this.extractMetrics(result)
        });
      } catch (error) {
        results.push({
          actionId: action.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }

  // Communication methods
  public async communicate(protocol: CommunicationProtocol): Promise<void> {
    this.communicationProtocol = protocol;
    
    // Subscribe to messages for this agent
    protocol.subscribe(this.id, async (message: AgentMessage) => {
      await this.handleMessage(message);
    });
  }

  protected async sendMessage(
    to: string,
    content: any,
    type: AgentMessage['type'] = 'request',
    priority: AgentMessage['priority'] = 'medium'
  ): Promise<void> {
    if (!this.communicationProtocol) {
      throw new Error('Communication protocol not initialized');
    }

    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.id,
      to,
      type,
      priority,
      content,
      timestamp: new Date(),
      requiresResponse: type === 'request'
    };

    await this.communicationProtocol.sendMessage(message);
  }

  protected async broadcastUpdate(content: any, priority: AgentMessage['priority'] = 'low'): Promise<void> {
    if (!this.communicationProtocol) return;
    
    await this.communicationProtocol.broadcast(content, priority);
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    try {
      // Store message in short-term memory
      this.updateShortTermMemory(`message_${message.id}`, message);
      
      // Process based on message type
      switch (message.type) {
        case 'request':
          await this.handleRequest(message);
          break;
        case 'broadcast':
          await this.handleBroadcast(message);
          break;
        case 'alert':
          await this.handleAlert(message);
          break;
        case 'update':
          await this.handleUpdate(message);
          break;
      }
    } catch (error) {
      this.performanceMetrics.errors.push(`Message handling error: ${error}`);
    }
  }

  protected async handleRequest(message: AgentMessage): Promise<void> {
    // Default implementation - override in specific agents
    await this.sendMessage(
      message.from, 
      { status: 'acknowledged', originalRequest: message.id },
      'response'
    );
  }

  protected async handleBroadcast(message: AgentMessage): Promise<void> {
    // Default implementation - store in memory
    this.updateLongTermMemory(`broadcast_${message.id}`, message.content);
  }

  protected async handleAlert(message: AgentMessage): Promise<void> {
    // Default implementation - log as warning
    this.performanceMetrics.warnings.push(`Alert: ${JSON.stringify(message.content)}`);
  }

  protected async handleUpdate(message: AgentMessage): Promise<void> {
    // Default implementation - update relevant memory
    this.updateShortTermMemory(`update_${message.from}`, message.content);
  }

  // Collaboration methods
  public async collaborate(otherAgents: Agent[], task: any): Promise<any> {
    // Create collaboration context
    const collaborationId = `collab_${Date.now()}`;
    
    // Broadcast collaboration request
    await this.broadcastUpdate({
      type: 'collaboration_request',
      id: collaborationId,
      task,
      participants: otherAgents.map(a => a.id),
      coordinator: this.id
    }, 'high');

    // Wait for responses and coordinate
    // This is a simplified version - full implementation would be more complex
    const responses = await Promise.all(
      otherAgents.map(agent => this.requestCollaboration(agent, task))
    );

    return this.synthesizeCollaborationResults(responses);
  }

  private async requestCollaboration(agent: Agent, task: any): Promise<any> {
    // Implementation depends on specific collaboration patterns
    return { agentId: agent.id, contribution: 'placeholder' };
  }

  private synthesizeCollaborationResults(responses: any[]): any {
    // Combine results from multiple agents
    return {
      success: true,
      contributions: responses,
      synthesizedResult: 'Combined agent outputs'
    };
  }

  // Learning methods
  public async learn(experience: Experience): Promise<void> {
    // Add to episodic memory
    this.memory.episodic.experiences.push(experience);
    
    // Extract patterns
    await this.extractPatterns(experience);
    
    // Update semantic knowledge
    await this.updateSemanticKnowledge(experience);
    
    // Update behavior models based on success/failure
    await this.updateBehaviorModels(experience);
  }

  private async extractPatterns(experience: Experience): Promise<void> {
    // Analyze experience for patterns
    const conditions = this.extractConditions(experience.context);
    const outcomes = this.extractOutcomes(experience.results);
    
    // Look for existing patterns
    const existingPattern = this.memory.episodic.patterns.find(p => 
      this.patternsMatch(p.conditions, conditions)
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.occurrences++;
      existingPattern.lastSeen = new Date();
      if (experience.success) {
        existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.1);
      } else {
        existingPattern.confidence = Math.max(0, existingPattern.confidence - 0.05);
      }
    } else {
      // Create new pattern
      this.memory.episodic.patterns.push({
        id: `pattern_${Date.now()}`,
        description: `Pattern from ${experience.type}`,
        conditions,
        outcomes,
        confidence: experience.success ? 0.7 : 0.3,
        occurrences: 1,
        lastSeen: new Date()
      });
    }
  }

  private extractConditions(context: Context): string[] {
    // Extract relevant conditions from context
    return [
      `user_industry_${context.userProfile?.industry}`,
      `goal_count_${context.currentGoals?.length || 0}`,
      `time_of_day_${new Date().getHours()}`
    ];
  }

  private extractOutcomes(results: Result[]): string[] {
    // Extract outcomes from results
    return results.map(r => 
      r.success ? `success_${r.actionId}` : `failure_${r.actionId}`
    );
  }

  private patternsMatch(conditions1: string[], conditions2: string[]): boolean {
    // Simple pattern matching - could be more sophisticated
    const intersection = conditions1.filter(c => conditions2.includes(c));
    return intersection.length >= Math.min(conditions1.length, conditions2.length) * 0.7;
  }

  private async updateSemanticKnowledge(experience: Experience): Promise<void> {
    // Extract new concepts and relationships from experience
    for (const learning of experience.learnings) {
      if (learning.type === 'success_pattern' || learning.type === 'optimization') {
        // Add to semantic memory as a strategy
        this.memory.semantic.strategies.push({
          id: `strategy_${Date.now()}`,
          name: learning.content,
          domain: this.role,
          steps: learning.evidence,
          conditions: learning.applicability,
          successRate: learning.confidence,
          lastUsed: new Date()
        });
      }
    }
  }

  private async updateBehaviorModels(experience: Experience): Promise<void> {
    // Update decision-making based on experience outcomes
    if (experience.success) {
      // Reinforce successful behaviors
      this.memory.episodic.successCases.push({
        id: `success_${Date.now()}`,
        scenario: experience.type,
        actions: experience.actions,
        results: experience.results,
        keyFactors: experience.learnings.map(l => l.content),
        replicability: experience.learnings.reduce((sum, l) => sum + l.confidence, 0) / experience.learnings.length
      });
    } else {
      // Learn from failures
      this.memory.episodic.failureCases.push({
        id: `failure_${Date.now()}`,
        scenario: experience.type,
        actions: experience.actions,
        results: experience.results,
        rootCauses: experience.results.filter(r => !r.success).map(r => r.error || 'Unknown'),
        prevention: experience.learnings.map(l => l.content)
      });
    }
  }

  public async adaptBehavior(feedback: any): Promise<void> {
    // Adapt behavior based on external feedback
    this.updateLongTermMemory('user_feedback', feedback);
    
    // Adjust confidence in recent strategies
    const recentStrategies = this.memory.semantic.strategies
      .filter(s => s.lastUsed && s.lastUsed > new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    for (const strategy of recentStrategies) {
      if (feedback.positive) {
        strategy.successRate = Math.min(1, strategy.successRate + 0.1);
      } else {
        strategy.successRate = Math.max(0, strategy.successRate - 0.1);
      }
    }
  }

  // Memory management
  protected updateShortTermMemory(key: string, value: any): void {
    this.memory.shortTerm.set(key, {
      value,
      timestamp: new Date(),
      accessed: 0
    });
    
    // Clean old entries (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [k, v] of this.memory.shortTerm.entries()) {
      if (v.timestamp < oneHourAgo) {
        this.memory.shortTerm.delete(k);
      }
    }
  }

  protected getShortTermMemory(key: string): any {
    const entry = this.memory.shortTerm.get(key);
    if (entry) {
      entry.accessed++;
      return entry.value;
    }
    return null;
  }

  protected updateLongTermMemory(key: string, value: any, importance: number = 0.5): void {
    this.memory.longTerm.store.set(key, value);
    this.memory.longTerm.importance.set(key, importance);
    this.memory.longTerm.lastAccessed.set(key, new Date());
  }

  protected getLongTermMemory(key: string): any {
    const value = this.memory.longTerm.store.get(key);
    if (value) {
      this.memory.longTerm.lastAccessed.set(key, new Date());
    }
    return value;
  }

  private async storeExperience(experience: Experience): Promise<void> {
    this.memory.episodic.experiences.push(experience);
    
    // Keep only recent experiences (last 1000)
    if (this.memory.episodic.experiences.length > 1000) {
      this.memory.episodic.experiences = this.memory.episodic.experiences
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 1000);
    }
  }

  // Lifecycle methods
  public async initialize(config: any): Promise<void> {
    // Load any persistent memory or configuration
    this.updateLongTermMemory('initialization_config', config);
    this.updateLongTermMemory('initialized_at', new Date());
  }

  public async start(): Promise<void> {
    this.isActive = true;
    this.updateShortTermMemory('status', 'active');
    console.log(`Agent ${this.name} (${this.id}) started`);
  }

  public async stop(): Promise<void> {
    this.isActive = false;
    this.updateShortTermMemory('status', 'stopped');
    console.log(`Agent ${this.name} (${this.id}) stopped`);
  }

  public getStatus(): AgentStatus {
    const totalTasks = this.performanceMetrics.tasksCompleted;
    const avgResponseTime = totalTasks > 0 
      ? this.performanceMetrics.totalResponseTime / totalTasks 
      : 0;

    return {
      id: this.id,
      isActive: this.isActive,
      currentTask: this.getShortTermMemory('currentTask'),
      performance: {
        tasksCompleted: this.performanceMetrics.tasksCompleted,
        successRate: this.performanceMetrics.successRate,
        averageResponseTime: avgResponseTime,
        resourceUtilization: this.calculateResourceUtilization()
      },
      memory: {
        shortTermUsage: this.memory.shortTerm.size,
        longTermSize: this.memory.longTerm.store.size,
        episodicEvents: this.memory.episodic.experiences.length,
        semanticConcepts: this.memory.semantic.concepts.size
      },
      health: {
        status: this.determineHealthStatus(),
        errors: [...this.performanceMetrics.errors],
        warnings: [...this.performanceMetrics.warnings],
        lastHealthCheck: new Date()
      }
    };
  }

  // Utility methods
  private updatePerformanceMetrics(actions: Action[], results: Result[], responseTime: number): void {
    this.performanceMetrics.tasksCompleted++;
    this.performanceMetrics.totalResponseTime += responseTime;
    
    const successfulResults = results.filter(r => r.success);
    this.performanceMetrics.successRate = 
      (this.performanceMetrics.successRate * (this.performanceMetrics.tasksCompleted - 1) + 
       (successfulResults.length / results.length)) / this.performanceMetrics.tasksCompleted;
  }

  private extractMetrics(result: any): Record<string, number> {
    // Extract relevant metrics from tool results
    if (typeof result === 'object' && result.metrics) {
      return result.metrics;
    }
    return {};
  }

  private calculateResourceUtilization(): number {
    // Calculate current resource usage
    const memoryUsage = (this.memory.shortTerm.size + this.memory.longTerm.store.size) / 10000;
    const taskLoad = this.getShortTermMemory('currentTask') ? 1 : 0;
    return Math.min(1, (memoryUsage + taskLoad) / 2);
  }

  private determineHealthStatus(): 'healthy' | 'degraded' | 'error' {
    if (this.performanceMetrics.errors.length > 10) return 'error';
    if (this.performanceMetrics.warnings.length > 5 || this.performanceMetrics.successRate < 0.7) return 'degraded';
    return 'healthy';
  }

  // Helper method for getting current context
  protected async getCurrentContext(): Promise<{ contextPrompt: string }> {
    return getCurrentContext();
  }

  // Helper method for generating unique IDs
  protected generateId(prefix: string = 'item'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}