// Core Agent System Types
// AuthorityPilot Agentic AI Architecture

export interface Context {
  timestamp: Date;
  userId: string;
  userProfile?: any;
  currentGoals?: Goal[];
  recentEvents?: Event[];
  environmentData?: Record<string, any>;
}

export interface Observation {
  id: string;
  type: 'user_action' | 'performance_data' | 'external_signal' | 'opportunity';
  source: string;
  data: any;
  confidence: number;
  timestamp: Date;
  relevance: number;
}

export interface Thought {
  id: string;
  type: 'analysis' | 'hypothesis' | 'insight' | 'concern';
  content: string;
  reasoning: string;
  confidence: number;
  implications: string[];
  relatedObservations: string[];
}

export interface Plan {
  id: string;
  objective: string;
  steps: PlanStep[];
  timeline: Timeline;
  resources: Resource[];
  riskAssessment: Risk[];
  successMetrics: Metric[];
  alternatives: Alternative[];
}

export interface PlanStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  expectedOutcome: string;
  dependencies: string[];
  estimatedDuration: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Action {
  id: string;
  type: 'content_creation' | 'engagement' | 'analysis' | 'communication' | 'optimization';
  target: string;
  parameters: Record<string, any>;
  timestamp: Date;
  expectedResult: string;
  actualResult?: any;
  success?: boolean;
  reasoning: string;
}

export interface Result {
  actionId: string;
  success: boolean;
  data?: any;
  error?: string;
  metrics?: Record<string, number>;
  feedback?: string;
  timestamp: Date;
  learnings?: string[];
}

export interface Learning {
  id: string;
  type: 'success_pattern' | 'failure_analysis' | 'user_preference' | 'optimization';
  content: string;
  evidence: string[];
  confidence: number;
  applicability: string[];
  timestamp: Date;
  sourceActions: string[];
}

export interface Goal {
  id: string;
  type: 'authority_building' | 'engagement' | 'follower_growth' | 'thought_leadership';
  description: string;
  target: number;
  current: number;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-1
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  description: string;
  target: number;
  achieved: boolean;
  achievedAt?: Date;
}

export interface Event {
  id: string;
  type: 'user_interaction' | 'content_performance' | 'external_mention' | 'market_change';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: number; // 1-10
  timestamp: Date;
  relatedGoals: string[];
  actionRequired?: boolean;
}

export interface Timeline {
  start: Date;
  end: Date;
  phases: Phase[];
  checkpoints: Checkpoint[];
}

export interface Phase {
  id: string;
  name: string;
  duration: number;
  objectives: string[];
  deliverables: string[];
}

export interface Checkpoint {
  date: Date;
  criteria: string[];
  action: 'continue' | 'adjust' | 'abort';
}

export interface Resource {
  type: 'ai_model' | 'api_call' | 'human_time' | 'tool_access';
  description: string;
  cost: number;
  availability: boolean;
}

export interface Risk {
  description: string;
  probability: number; // 0-1
  impact: number; // 1-10
  mitigation: string;
  contingency: string;
}

export interface Metric {
  name: string;
  target: number;
  current?: number;
  unit: string;
  measurement: 'increase' | 'decrease' | 'maintain';
}

export interface Alternative {
  description: string;
  probability: number;
  reasoning: string;
  tradeoffs: string[];
}

// Agent Memory System
export interface AgentMemory {
  shortTerm: Map<string, any>; // Current context, expires
  longTerm: LongTermMemory; // Persistent learning
  episodic: EpisodicMemory; // Past experiences
  semantic: SemanticMemory; // Domain knowledge
}

export interface LongTermMemory {
  store: Map<string, any>;
  connections: Map<string, string[]>;
  importance: Map<string, number>;
  lastAccessed: Map<string, Date>;
}

export interface EpisodicMemory {
  experiences: Experience[];
  patterns: Pattern[];
  successCases: SuccessCase[];
  failureCases: FailureCase[];
}

export interface Experience {
  id: string;
  type: string;
  context: Context;
  actions: Action[];
  results: Result[];
  learnings: Learning[];
  timestamp: Date;
  success: boolean;
  tags: string[];
}

export interface Pattern {
  id: string;
  description: string;
  conditions: string[];
  outcomes: string[];
  confidence: number;
  occurrences: number;
  lastSeen: Date;
}

export interface SuccessCase {
  id: string;
  scenario: string;
  actions: Action[];
  results: Result[];
  keyFactors: string[];
  replicability: number; // 0-1
}

export interface FailureCase {
  id: string;
  scenario: string;
  actions: Action[];
  results: Result[];
  rootCauses: string[];
  prevention: string[];
}

export interface SemanticMemory {
  concepts: Map<string, Concept>;
  relationships: Map<string, Relationship>;
  rules: Rule[];
  strategies: Strategy[];
}

export interface Concept {
  id: string;
  name: string;
  definition: string;
  properties: Map<string, any>;
  examples: string[];
  relatedConcepts: string[];
  confidence: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number; // 0-1
  evidence: string[];
}

export interface Rule {
  id: string;
  condition: string;
  action: string;
  confidence: number;
  exceptions: string[];
  sourceExperiences: string[];
}

export interface Strategy {
  id: string;
  name: string;
  domain: string;
  steps: string[];
  conditions: string[];
  successRate: number;
  lastUsed: Date;
}

// Agent Tools
export interface Tool {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  parameters: ToolParameter[];
  cost: number;
  reliability: number; // 0-1
  execute(params: Record<string, any>): Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  validation?: (value: any) => boolean;
}

// Agent Communication
export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'all';
  type: 'request' | 'response' | 'broadcast' | 'alert' | 'update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  content: any;
  timestamp: Date;
  requiresResponse: boolean;
  deadline?: Date;
  relatedMessages?: string[];
}

export interface CommunicationProtocol {
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(messageId: string): Promise<AgentMessage>;
  broadcast(content: any, priority: string): Promise<void>;
  subscribe(messageType: string, handler: (message: AgentMessage) => void): void;
}

// Core Agent Interface
export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  memory: AgentMemory;
  tools: Tool[];
  isActive: boolean;
  
  // Core cognitive methods
  perceive(context: Context): Promise<Observation[]>;
  think(observations: Observation[]): Promise<Thought[]>;
  plan(thoughts: Thought[]): Promise<Plan>;
  act(plan: Plan): Promise<Action[]>;
  reflect(actions: Action[], results: Result[]): Promise<Learning[]>;
  
  // Communication methods
  communicate(protocol: CommunicationProtocol): Promise<void>;
  collaborate(otherAgents: Agent[], task: any): Promise<any>;
  
  // Learning methods
  learn(experience: Experience): Promise<void>;
  adaptBehavior(feedback: any): Promise<void>;
  
  // Lifecycle methods
  initialize(config: any): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): AgentStatus;
}

export interface AgentStatus {
  id: string;
  isActive: boolean;
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    resourceUtilization: number;
  };
  memory: {
    shortTermUsage: number;
    longTermSize: number;
    episodicEvents: number;
    semanticConcepts: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'error';
    errors: string[];
    warnings: string[];
    lastHealthCheck: Date;
  };
}

// Specialized Agent Types
export interface StrategyAgent extends Agent {
  analyzeIndustry(industry: string): Promise<any>;
  findUniquePositioning(user: any, analysis: any): Promise<any>;
  defineContentPillars(user: any, positioning: any): Promise<any>;
  setStrategicGoals(user: any): Promise<Goal[]>;
  adjustStrategy(strategy: any, performance: any): Promise<any>;
}

export interface ContentCreatorAgent extends Agent {
  createContent(brief: any, voiceProfile: any): Promise<any>;
  refineContent(draft: any): Promise<any>;
  generateVariations(content: any): Promise<any>;
  learnFromFeedback(content: any, feedback: any): Promise<void>;
}

export interface EngagementAgent extends Agent {
  findOpportunities(): Promise<any[]>;
  engageThoughtfully(opportunity: any, voice: any): Promise<any>;
  nurture(relationship: any): Promise<any>;
  buildRelationshipGraph(): Promise<any>;
}

export interface AnalyticsAgent extends Agent {
  analyzePerformance(): Promise<any>;
  detectPatterns(data: any): Promise<any>;
  predictOutcomes(scenario: any): Promise<any>;
  generateInsights(data: any): Promise<any>;
}

export interface OrchestratorAgent extends Agent {
  coordinateAgents(agents: Agent[], task: any): Promise<any>;
  prioritizeTasks(tasks: any[]): Promise<any>;
  allocateResources(agents: Agent[], resources: Resource[]): Promise<any>;
  monitorExecution(plan: Plan): Promise<any>;
}

// Agent Factory
export interface AgentFactory {
  createAgent(type: string, config: any): Promise<Agent>;
  getAgentTypes(): string[];
  validateConfig(type: string, config: any): boolean;
}

// Agent Registry
export interface AgentRegistry {
  register(agent: Agent): Promise<void>;
  unregister(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<Agent>;
  getAllAgents(): Promise<Agent[]>;
  getAgentsByRole(role: string): Promise<Agent[]>;
  getActiveAgents(): Promise<Agent[]>;
}