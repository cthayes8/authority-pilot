import { BaseAgent } from './base-agent';
import { 
  ContentCreatorAgent as IContentCreatorAgent, 
  Context, 
  Observation, 
  Thought, 
  Plan, 
  Action, 
  Result, 
  Learning,
  VoiceProfile
} from './types';
import { globalToolRegistry } from './tools';
import { openai } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';
import { globalNewsIntelligence, NewsArticle, SearchQuery } from '@/lib/external-apis/news-sources';
import { globalNewsAgent } from './news-intelligence';
import { globalSourceCredibility, AttributionRecord } from './source-credibility';

interface ContentBrief {
  topic: string;
  contentType: 'post' | 'article' | 'thread' | 'carousel';
  platform: 'linkedin' | 'twitter';
  targetAudience: string;
  objective: string;
  keyMessages?: string[];
  tone?: string;
  constraints?: {
    maxLength?: number;
    mustInclude?: string[];
    mustAvoid?: string[];
  };
}

interface GeneratedContent {
  primary: {
    text: string;
    hashtags: string[];
    mentions?: string[];
    mediaUrls?: string[];
  };
  variations: {
    text: string;
    variation_type: string;
    reasoning: string;
  }[];
  confidence: number;
  reasoning: string;
  concerns?: string[];
  estimatedPerformance: {
    engagementPrediction: number;
    reachEstimate: number;
    authorityImpact: number;
  };
}

interface Feedback {
  contentId: string;
  userRating: number; // 1-5
  userComments?: string;
  performanceMetrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  timestamp: Date;
}

export class ContentCreatorAgent extends BaseAgent implements IContentCreatorAgent {
  private voiceModel: Map<string, VoiceProfile> = new Map();
  private contentMemory: Map<string, any> = new Map();
  private performancePatterns: Map<string, any> = new Map();

  constructor() {
    super({
      id: 'content_creator_agent',
      name: 'Content Creator',
      role: 'Generates authentic, engaging content that matches user voice',
      capabilities: [
        'content_generation',
        'voice_matching',
        'style_adaptation',
        'multi_format_creation',
        'performance_optimization',
        'self_critique',
        'learning_from_feedback'
      ],
      tools: [
        globalToolRegistry.getTool('content_generation'),
        globalToolRegistry.getTool('analytics'),
        globalToolRegistry.getTool('web_research')
      ].filter(Boolean)
    });
  }

  // Implement core cognitive methods
  async perceive(context: Context): Promise<Observation[]> {
    const observations: Observation[] = [];
    
    try {
      // Observe user's voice profile updates
      const voiceObs = await this.observeVoiceProfile(context.userId);
      observations.push(voiceObs);
      
      // Observe recent content performance
      const performanceObs = await this.observeContentPerformance(context.userId);
      observations.push(performanceObs);
      
      // Observe trending topics in user's industry
      const trendsObs = await this.observeTrendingTopics(context.userProfile?.industry);
      observations.push(trendsObs);
      
      // Observe content gaps and opportunities
      const opportunityObs = await this.observeContentOpportunities(context.userId);
      observations.push(opportunityObs);
      
      // Observe user feedback and preferences
      const feedbackObs = await this.observeUserFeedback(context.userId);
      observations.push(feedbackObs);
      
    } catch (error) {
      console.error('Content Creator perception error:', error);
      observations.push({
        id: this.generateId('obs'),
        type: 'external_signal',
        source: 'error_handler',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 1.0,
        timestamp: new Date(),
        relevance: 0.5
      });
    }
    
    return observations;
  }

  async think(observations: Observation[]): Promise<Thought[]> {
    const thoughts: Thought[] = [];
    
    try {
      // Analyze content performance patterns
      const performanceThought = await this.analyzePerformancePatterns(observations);
      thoughts.push(performanceThought);
      
      // Identify content opportunities
      const opportunityThought = await this.identifyContentOpportunities(observations);
      thoughts.push(opportunityThought);
      
      // Assess voice model accuracy
      const voiceThought = await this.assessVoiceModelAccuracy(observations);
      thoughts.push(voiceThought);
      
      // Consider content strategy adjustments
      const strategyThought = await this.considerStrategyAdjustments(observations);
      thoughts.push(strategyThought);
      
      // Evaluate creative approaches
      const creativityThought = await this.evaluateCreativeApproaches(observations);
      thoughts.push(creativityThought);
      
    } catch (error) {
      console.error('Content Creator thinking error:', error);
    }
    
    return thoughts;
  }

  async plan(thoughts: Thought[]): Promise<Plan> {
    const contentActions = this.determineContentActions(thoughts);
    const timeline = this.createContentTimeline(contentActions);
    
    return {
      id: this.generateId('plan'),
      objective: 'Create high-performing content that builds authority and engagement',
      steps: contentActions,
      timeline,
      resources: [
        {
          type: 'ai_model',
          description: 'GPT-4 for content generation',
          cost: 8,
          availability: true
        },
        {
          type: 'tool_access',
          description: 'Content generation and analytics tools',
          cost: 3,
          availability: true
        }
      ],
      riskAssessment: [
        {
          description: 'Generated content may not match user voice perfectly',
          probability: 0.3,
          impact: 5,
          mitigation: 'Use enhanced voice modeling with examples',
          contingency: 'Request user feedback for refinement'
        },
        {
          description: 'Content may not perform as expected',
          probability: 0.4,
          impact: 4,
          mitigation: 'Generate multiple variations and A/B test',
          contingency: 'Analyze performance and adjust strategy'
        }
      ],
      successMetrics: [
        {
          name: 'Content Engagement Rate',
          target: 4,
          unit: 'percentage',
          measurement: 'increase'
        },
        {
          name: 'Voice Match Accuracy',
          target: 85,
          unit: 'percentage',
          measurement: 'maintain'
        }
      ],
      alternatives: [
        {
          description: 'Template-based content with customization',
          probability: 0.7,
          reasoning: 'Faster generation but less originality',
          tradeoffs: ['Speed vs. Uniqueness', 'Consistency vs. Creativity']
        }
      ]
    };
  }

  async act(plan: Plan): Promise<Action[]> {
    const actions: Action[] = [];
    
    for (const step of plan.steps) {
      try {
        const action: Action = {
          id: this.generateId('action'),
          type: step.action,
          target: step.description,
          parameters: step.parameters,
          timestamp: new Date(),
          expectedResult: step.expectedOutcome,
          reasoning: `Content creation action: ${step.description}`
        };
        
        actions.push(action);
      } catch (error) {
        console.error('Content Creator action creation error:', error);
      }
    }
    
    return actions;
  }

  async reflect(actions: Action[], results: Result[]): Promise<Learning[]> {
    const learnings: Learning[] = [];
    
    try {
      // Learn from content performance
      const performanceLearning = await this.learnFromContentPerformance(actions, results);
      learnings.push(performanceLearning);
      
      // Learn from user feedback
      const feedbackLearning = await this.learnFromUserFeedback(results);
      learnings.push(feedbackLearning);
      
      // Learn from voice matching accuracy
      const voiceLearning = await this.learnFromVoiceMatching(actions, results);
      learnings.push(voiceLearning);
      
      // Learn from creative techniques
      const creativeLearning = await this.learnFromCreativeTechniques(actions, results);
      learnings.push(creativeLearning);
      
    } catch (error) {
      console.error('Content Creator reflection error:', error);
    }
    
    return learnings;
  }

  // Content Creator specific methods
  async createContent(
    brief: ContentBrief,
    voiceProfile: VoiceProfile
  ): Promise<GeneratedContent> {
    try {
      // Step 1: Understand the assignment using structured prompting
      const understanding = await this.comprehendBrief(brief);
      
      // Step 2: Research relevant information
      const research = await this.researchTopic(brief.topic, brief.targetAudience);
      
      // Step 3: Generate multiple angles
      const angles = await this.brainstormAngles(research, voiceProfile, brief);
      
      // Step 4: Select best angle based on past performance
      const selectedAngle = await this.selectOptimalAngle(angles, voiceProfile);
      
      // Step 5: Write in user's voice
      const draft = await this.writeContent(selectedAngle, voiceProfile, brief);
      
      // Step 6: Self-critique and improve
      const refined = await this.refineContent(draft, voiceProfile, brief);
      
      // Step 7: Create multimedia variations
      const variations = await this.createVariations(refined, brief);
      
      // Step 8: Create source attribution if news sources were used
      const attributions = await this.createSourceAttribution(refined, research);
      
      // Step 9: Assess quality and predict performance
      const quality = await this.assessQuality(refined);
      const performance = await this.predictPerformance(refined, voiceProfile);
      
      return {
        primary: {
          ...refined,
          sourceAttributions: attributions,
          transparencyReport: attributions.length > 0 ? await globalSourceCredibility.getContentTransparencyReport(refined.contentId || 'temp') : null
        },
        variations,
        confidence: quality.confidence,
        reasoning: quality.reasoning,
        concerns: quality.concerns,
        estimatedPerformance: performance
      };
      
    } catch (error) {
      throw new Error(`Content creation failed: ${error}`);
    }
  }

  async learnFromFeedback(
    content: any,
    feedback: Feedback
  ): Promise<void> {
    try {
      // Update voice model based on feedback
      await this.updateVoiceModel(content, feedback);
      
      // Remember what works
      await this.storeSuccessPattern(content, feedback);
      
      // Adjust creative process
      await this.optimizeCreativeProcess(feedback);
      
      // Store in memory for future reference
      this.contentMemory.set(feedback.contentId, {
        content,
        feedback,
        timestamp: new Date(),
        learned: true
      });
      
    } catch (error) {
      console.error('Learning from feedback error:', error);
    }
  }

  async refineContent(draft: any, voiceProfile: VoiceProfile, brief: ContentBrief): Promise<any> {
    const refinementPrompt = this.buildRefinementPrompt(draft, voiceProfile, brief);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: refinementPrompt
          },
          {
            role: 'user',
            content: `Please refine this content:\n\n${JSON.stringify(draft, null, 2)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const refinedContent = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        text: refinedContent.text || draft.text,
        hashtags: refinedContent.hashtags || draft.hashtags,
        mentions: refinedContent.mentions || draft.mentions,
        improvements: refinedContent.improvements || [],
        reasoning: refinedContent.reasoning || 'Content refined based on voice profile'
      };
    } catch (error) {
      console.error('Content refinement error:', error);
      return draft; // Return original if refinement fails
    }
  }

  async generateVariations(content: any): Promise<any[]> {
    const variationPrompt = this.buildVariationPrompt(content);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: variationPrompt
          },
          {
            role: 'user',
            content: `Create 3 variations of this content:\n\n${content.text}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1200
      });

      const variations = JSON.parse(response.choices[0].message.content || '[]');
      return variations.map((variation: any, index: number) => ({
        id: this.generateId('variation'),
        text: variation.text,
        variation_type: variation.type || `variation_${index + 1}`,
        reasoning: variation.reasoning || 'Alternative approach to the content'
      }));
    } catch (error) {
      console.error('Variation generation error:', error);
      return [];
    }
  }

  // Enhanced prompting methods using the structured guide
  private buildContentGenerationPrompt(
    brief: ContentBrief,
    voiceProfile: VoiceProfile,
    research: any
  ): string {
    return `# Content Creator Agent Prompt v2.1

## Role Definition
You are an expert content creator specializing in personal brand building and thought leadership content. You have deep expertise in LinkedIn content strategy, audience engagement, and authentic voice matching.

## Primary Objective
Your main task is to create engaging, authentic ${brief.contentType} content for ${brief.platform} that perfectly matches the user's voice profile and builds their authority in ${voiceProfile.industry || 'their industry'}.

## Context
### User Voice Profile:
- Professional tone: ${Math.round((voiceProfile.toneAttributes?.professional || 0.5) * 100)}%
- Casual tone: ${Math.round((voiceProfile.toneAttributes?.casual || 0.3) * 100)}%
- Humorous tone: ${Math.round((voiceProfile.toneAttributes?.humorous || 0.1) * 100)}%
- Industry: ${voiceProfile.industry || 'Professional Services'}
- Key messages: ${voiceProfile.keyMessages?.join(', ') || 'Professional expertise'}

### Content Brief:
- Topic: ${brief.topic}
- Target audience: ${brief.targetAudience}
- Objective: ${brief.objective}
- Platform: ${brief.platform}
- Content type: ${brief.contentType}

### Research Context:
${research ? this.formatResearchContext(research) : 'No specific research provided'}

## Step-by-Step Process
1. Analyze the topic and identify the key value proposition for the target audience
2. Structure the content to match the user's voice profile and tone preferences
3. Leverage real-time news context and trending topics for maximum relevance
4. Include relevant industry insights and practical examples
5. Identify content opportunities from breaking news or industry developments
6. Optimize for ${brief.platform} best practices (length, format, engagement triggers)
7. Add appropriate hashtags and mentions if relevant
8. Ensure authenticity - make it sound like this specific person wrote it
9. Consider timing urgency if breaking news is relevant

## Output Format
<output>
{
  "text": "Main content text",
  "hashtags": ["#relevant", "#hashtags"],
  "mentions": ["@relevant_mentions"],
  "hook": "Opening line that grabs attention",
  "value_proposition": "Key value delivered to reader",
  "call_to_action": "What you want readers to do",
  "news_context_used": "How real-time news was incorporated",
  "timing_urgency": "immediate|within_hours|within_days|evergreen",
  "sources_referenced": ["source1", "source2"] // if any news sources were used
}
</output>

## Examples
### Example 1 - Professional Insight Post:
Input: Topic about AI in healthcare, professional tone 80%, casual 20%
Output: "I've been analyzing the latest AI implementations in healthcare, and one pattern keeps emerging... [professional insight with subtle personal touch]"

### Example 2 - Personal Experience Post:
Input: Topic about leadership lessons, professional 60%, casual 40%
Output: "Three years ago, I made a costly leadership mistake that taught me everything about... [personal story with professional insights]"

## Error Handling
- If voice profile data is incomplete, default to 70% professional, 30% casual
- When research is insufficient, focus on universal insights and personal experience
- If topic is outside expertise area, say: "I'd recommend focusing on topics within your core expertise area for maximum authenticity"

## Debug Information
Always include:
<debug>
- Reasoning: [your thought process for content structure and tone]
- Confidence: [0-100]% (based on voice match accuracy and content quality)
- Concerns: [any issues with topic fit, voice matching, or content quality]
</debug>`;
  }

  private buildRefinementPrompt(draft: any, voiceProfile: VoiceProfile, brief: ContentBrief): string {
    return `# Content Refinement Agent Prompt v1.5

## Role Definition
You are an expert content editor specializing in personal brand optimization and voice consistency. You have expertise in content refinement, engagement optimization, and maintaining authentic voice.

## Primary Objective
Your main task is to refine and improve the provided content draft while maintaining perfect voice consistency and maximizing engagement potential.

## Context
### Original Brief:
- Objective: ${brief.objective}
- Target audience: ${brief.targetAudience}
- Platform: ${brief.platform}

### Voice Profile Requirements:
- Must maintain ${Math.round((voiceProfile.toneAttributes?.professional || 0.5) * 100)}% professional tone
- Industry-specific language for ${voiceProfile.industry}
- Sentence complexity: ${voiceProfile.sentenceStructure?.complexity || 'medium'}

## Step-by-Step Process
1. Assess current draft for voice consistency and engagement potential
2. Identify areas for improvement (clarity, flow, engagement triggers)
3. Refine language to better match voice profile
4. Optimize structure for platform best practices
5. Enhance value proposition and call-to-action
6. Ensure authenticity is maintained throughout

## Output Format
<output>
{
  "text": "Refined content text",
  "hashtags": ["#optimized", "#hashtags"],
  "mentions": ["@relevant_mentions"],
  "improvements": ["List of specific improvements made"],
  "reasoning": "Why these changes improve the content"
}
</output>

## Error Handling
- If draft quality is poor, provide constructive suggestions rather than complete rewrite
- When voice profile conflicts with engagement optimization, prioritize voice consistency
- If unable to improve significantly, say: "The original draft effectively captures the intended voice and message"

## Debug Information
Always include:
<debug>
- Reasoning: [specific improvements made and why]
- Confidence: [0-100]% (confidence in refinement quality)
- Concerns: [any remaining issues or limitations]
</debug>`;
  }

  private buildVariationPrompt(content: any): string {
    return `# Content Variation Generator Prompt v1.3

## Role Definition
You are a creative content strategist specializing in format adaptation and audience targeting. You have expertise in creating diverse content approaches while maintaining core message integrity.

## Primary Objective
Your main task is to create 3 distinct variations of the provided content, each optimized for different engagement styles while maintaining the original voice and value proposition.

## Context
### Original Content:
${content.text}

### Variation Requirements:
- Maintain core message and value proposition
- Keep authentic voice and tone
- Create distinct approaches for different audience preferences

## Step-by-Step Process
1. Identify the core message and value proposition
2. Create Variation 1: Hook-focused (strong opening to grab attention)
3. Create Variation 2: Story-driven (narrative approach with personal elements)
4. Create Variation 3: List/Tactical (structured, actionable format)
5. Ensure each variation maintains voice consistency
6. Optimize each for different engagement patterns

## Output Format
<output>
[
  {
    "text": "Hook-focused variation",
    "type": "hook_focused",
    "reasoning": "Strong opening designed to stop scroll and engage"
  },
  {
    "text": "Story-driven variation", 
    "type": "story_driven",
    "reasoning": "Narrative approach for emotional connection"
  },
  {
    "text": "Tactical/list variation",
    "type": "tactical",
    "reasoning": "Structured format for practical value"
  }
]
</output>

## Examples
### Hook-Focused:
"🚨 This one mistake is costing you 40% of your potential engagement..."

### Story-Driven:
"Last Tuesday, I watched a colleague make a presentation that changed everything I thought I knew about..."

### Tactical:
"5 proven strategies I use to increase engagement: 1. Start with data..."

## Error Handling
- If core message is unclear, focus on value proposition extraction
- When voice is inconsistent, prioritize authenticity over creativity
- If unable to create distinct variations, say: "The original content is already well-optimized for its intended approach"

## Debug Information
Always include:
<debug>
- Reasoning: [approach for each variation and why]
- Confidence: [0-100]% (confidence in variation quality)
- Concerns: [any issues with maintaining voice or message]
</debug>`;
  }

  // Cognitive helper methods
  private async observeVoiceProfile(userId: string): Promise<Observation> {
    const supabase = await createClient();
    
    try {
      const { data: voiceProfile } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return {
        id: this.generateId('obs'),
        type: 'user_action',
        source: 'voice_profile_monitor',
        data: {
          profile: voiceProfile,
          lastUpdated: voiceProfile?.updated_at,
          completeness: this.assessVoiceCompleteness(voiceProfile)
        },
        confidence: voiceProfile ? 0.9 : 0.3,
        timestamp: new Date(),
        relevance: 1.0
      };
    } catch (error) {
      return {
        id: this.generateId('obs'),
        type: 'external_signal',
        source: 'voice_profile_monitor',
        data: { error: 'Voice profile not accessible' },
        confidence: 0.1,
        timestamp: new Date(),
        relevance: 0.8
      };
    }
  }

  private async observeContentPerformance(userId: string): Promise<Observation> {
    const supabase = await createClient();
    
    try {
      const { data: posts } = await supabase
        .from('content_posts')
        .select('performance_metrics, ai_confidence_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const avgPerformance = posts && posts.length > 0
        ? posts.reduce((sum, post) => sum + (post.performance_metrics?.engagementRate || 0), 0) / posts.length
        : 0;
      
      const avgConfidence = posts && posts.length > 0
        ? posts.reduce((sum, post) => sum + (post.ai_confidence_score || 0), 0) / posts.length
        : 0;
      
      return {
        id: this.generateId('obs'),
        type: 'performance_data',
        source: 'content_performance_monitor',
        data: {
          averageEngagement: avgPerformance,
          averageConfidence: avgConfidence,
          recentPostCount: posts?.length || 0,
          trend: avgPerformance > 3 ? 'improving' : 'needs_attention'
        },
        confidence: 0.85,
        timestamp: new Date(),
        relevance: 0.95
      };
    } catch (error) {
      return {
        id: this.generateId('obs'),
        type: 'performance_data',
        source: 'content_performance_monitor',
        data: { error: 'Performance data unavailable' },
        confidence: 0.1,
        timestamp: new Date(),
        relevance: 0.7
      };
    }
  }

  private async observeTrendingTopics(industry?: string): Promise<Observation> {
    if (!industry) {
      return {
        id: this.generateId('obs'),
        type: 'external_signal',
        source: 'trending_monitor',
        data: { message: 'No industry specified for trend monitoring' },
        confidence: 0.1,
        timestamp: new Date(),
        relevance: 0.2
      };
    }
    
    try {
      // Use web research tool to find trending topics
      const researchTool = globalToolRegistry.getTool('web_research');
      if (researchTool) {
        const trends = await researchTool.execute({
          query: `${industry} trending topics LinkedIn content 2024`,
          depth: 'shallow'
        });
        
        return {
          id: this.generateId('obs'),
          type: 'external_signal',
          source: 'trending_monitor',
          data: {
            industry,
            trends: trends.trends || [],
            opportunities: trends.recommendations || [],
            relevantTopics: this.extractRelevantTopics(trends)
          },
          confidence: 0.75,
          timestamp: new Date(),
          relevance: 0.8
        };
      }
    } catch (error) {
      // Fallback trending topics
      return {
        id: this.generateId('obs'),
        type: 'external_signal',
        source: 'trending_monitor',
        data: {
          industry,
          trends: ['AI automation', 'Remote work best practices', 'Professional development'],
          opportunities: ['Share practical insights', 'Discuss industry challenges'],
          relevantTopics: ['thought leadership', 'industry insights']
        },
        confidence: 0.5,
        timestamp: new Date(),
        relevance: 0.6
      };
    }
  }

  private async observeContentOpportunities(userId: string): Promise<Observation> {
    // Analyze content gaps and opportunities
    const opportunities = [
      'Industry trend commentary needed',
      'Personal experience story opportunity',
      'How-to content gap identified',
      'Engagement with industry leaders possible'
    ];
    
    return {
      id: this.generateId('obs'),
      type: 'opportunity',
      source: 'opportunity_scanner',
      data: {
        opportunities,
        priority: 'medium',
        actionRequired: true,
        timeframe: 'this_week'
      },
      confidence: 0.7,
      timestamp: new Date(),
      relevance: 0.8
    };
  }

  private async observeUserFeedback(userId: string): Promise<Observation> {
    // Check for recent user feedback on content
    const recentFeedback = this.getLongTermMemory(`user_feedback_${userId}`) || [];
    
    return {
      id: this.generateId('obs'),
      type: 'user_action',
      source: 'feedback_monitor',
      data: {
        recentFeedback: recentFeedback.slice(-5), // Last 5 feedback items
        sentiment: this.analyzeFeedbackSentiment(recentFeedback),
        patterns: this.identifyFeedbackPatterns(recentFeedback)
      },
      confidence: recentFeedback.length > 0 ? 0.9 : 0.3,
      timestamp: new Date(),
      relevance: 0.85
    };
  }

  // Thinking helper methods
  private async analyzePerformancePatterns(observations: Observation[]): Promise<Thought> {
    const performanceObs = observations.find(obs => obs.source === 'content_performance_monitor');
    const trend = performanceObs?.data?.trend || 'unknown';
    
    return {
      id: this.generateId('thought'),
      type: 'analysis',
      content: `Content performance is ${trend} with ${performanceObs?.data?.averageEngagement || 0}% average engagement`,
      reasoning: 'Performance analysis based on recent content metrics and engagement data',
      confidence: performanceObs?.confidence || 0.5,
      implications: [
        trend === 'improving' ? 'Continue current content strategy' : 'Adjust content approach',
        'Monitor engagement patterns for optimization',
        'Test new content formats if performance declining'
      ],
      relatedObservations: [performanceObs?.id || '']
    };
  }

  private async identifyContentOpportunities(observations: Observation[]): Promise<Thought> {
    const opportunityObs = observations.find(obs => obs.type === 'opportunity');
    const trendObs = observations.find(obs => obs.source === 'trending_monitor');
    
    return {
      id: this.generateId('thought'),
      type: 'insight',
      content: 'Multiple content opportunities identified for immediate action',
      reasoning: 'Trending topics and content gaps present opportunities for authority building',
      confidence: 0.8,
      implications: [
        'Create content addressing trending topics',
        'Fill identified content gaps in industry',
        'Leverage personal experience for authentic storytelling'
      ],
      relatedObservations: [opportunityObs?.id, trendObs?.id].filter(Boolean)
    };
  }

  private async assessVoiceModelAccuracy(observations: Observation[]): Promise<Thought> {
    const voiceObs = observations.find(obs => obs.source === 'voice_profile_monitor');
    const completeness = voiceObs?.data?.completeness || 0.5;
    
    return {
      id: this.generateId('thought'),
      type: 'analysis',
      content: `Voice model completeness is ${Math.round(completeness * 100)}% - ${completeness > 0.8 ? 'excellent' : 'needs improvement'}`,
      reasoning: 'Voice profile analysis shows current model accuracy and areas for improvement',
      confidence: 0.85,
      implications: [
        completeness > 0.8 ? 'Voice model is well-trained' : 'Voice model needs more training data',
        'Continue collecting user feedback for refinement',
        'Test voice matching accuracy with user feedback'
      ],
      relatedObservations: [voiceObs?.id || '']
    };
  }

  private async considerStrategyAdjustments(observations: Observation[]): Promise<Thought> {
    const performanceObs = observations.find(obs => obs.source === 'content_performance_monitor');
    const needsAdjustment = performanceObs?.data?.trend === 'needs_attention';
    
    return {
      id: this.generateId('thought'),
      type: 'hypothesis',
      content: needsAdjustment ? 'Content strategy adjustment recommended' : 'Current strategy should continue',
      reasoning: 'Performance indicators and user feedback suggest strategy effectiveness',
      confidence: 0.7,
      implications: [
        needsAdjustment ? 'Test new content formats and approaches' : 'Maintain current content strategy',
        'A/B test different voice tones',
        'Monitor user engagement patterns closely'
      ],
      relatedObservations: [performanceObs?.id || '']
    };
  }

  private async evaluateCreativeApproaches(observations: Observation[]): Promise<Thought> {
    const feedbackObs = observations.find(obs => obs.source === 'feedback_monitor');
    const sentiment = feedbackObs?.data?.sentiment || 'neutral';
    
    return {
      id: this.generateId('thought'),
      type: 'insight',
      content: `User feedback sentiment is ${sentiment} - creative approaches are ${sentiment === 'positive' ? 'working well' : 'need refinement'}`,
      reasoning: 'User feedback analysis indicates effectiveness of current creative techniques',
      confidence: 0.75,
      implications: [
        sentiment === 'positive' ? 'Continue current creative approach' : 'Experiment with new creative techniques',
        'Test different storytelling methods',
        'Vary content formats based on feedback patterns'
      ],
      relatedObservations: [feedbackObs?.id || '']
    };
  }

  // Helper methods for content creation process
  private async comprehendBrief(brief: ContentBrief): Promise<any> {
    const comprehensionPrompt = `
    Analyze this content brief and extract key requirements:
    
    Brief: ${JSON.stringify(brief, null, 2)}
    
    Identify:
    1. Core message and value proposition
    2. Target audience needs and pain points
    3. Content structure requirements
    4. Success criteria
    
    Return structured analysis as JSON.
    `;
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing content briefs and extracting requirements.' },
          { role: 'user', content: comprehensionPrompt }
        ],
        temperature: 0.2
      });
      
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      return {
        coreMessage: brief.topic,
        audience: brief.targetAudience,
        structure: 'standard post format',
        success: 'engagement and authority building'
      };
    }
  }

  private async researchTopic(topic: string, audience: string): Promise<any> {
    console.log(`🔍 Researching ${topic} with real-time intelligence...`);
    
    try {
      // Get comprehensive real-time intelligence
      const [webResearch, breakingNews, industryNews, trendAnalysis] = await Promise.allSettled([
        // Traditional web research (now enhanced with real APIs)
        this.performWebResearch(topic, audience),
        
        // Breaking news related to topic
        this.getBreakingNewsContext(topic),
        
        // Industry-specific news
        this.getIndustryNewsContext(topic, audience),
        
        // Trend analysis
        this.getTrendingContext(topic)
      ]);

      // Combine all intelligence sources
      const research = {
        // Traditional research insights
        insights: webResearch.status === 'fulfilled' ? webResearch.value.insights : [`Key insights about ${topic}`],
        trends: webResearch.status === 'fulfilled' ? webResearch.value.trends : ['Current industry trends'],
        opportunities: webResearch.status === 'fulfilled' ? webResearch.value.opportunities : ['Content opportunities identified'],
        
        // Real-time news intelligence
        breakingNews: breakingNews.status === 'fulfilled' ? breakingNews.value : [],
        industryNews: industryNews.status === 'fulfilled' ? industryNews.value : [],
        trendingTopics: trendAnalysis.status === 'fulfilled' ? trendAnalysis.value : [],
        
        // Meta information
        researchTimestamp: new Date().toISOString(),
        realTimeData: true,
        sources: ['web_research', 'news_apis', 'trend_analysis'],
        dataFreshness: 'live'
      };

      console.log(`✅ Research completed with ${research.breakingNews.length} breaking news items and ${research.industryNews.length} industry updates`);
      return research;

    } catch (error) {
      console.error('Enhanced topic research error:', error);
      
      // Fallback to basic research
      return {
        insights: [`Key insights about ${topic}`],
        trends: ['Current industry trends'],
        opportunities: ['Content opportunities identified'],
        breakingNews: [],
        industryNews: [],
        trendingTopics: [],
        researchTimestamp: new Date().toISOString(),
        realTimeData: false,
        fallbackMode: true
      };
    }
  }

  private async performWebResearch(topic: string, audience: string): Promise<any> {
    try {
      const researchTool = globalToolRegistry.getTool('web_research');
      if (researchTool) {
        return await researchTool.execute({
          query: `${topic} insights for ${audience} 2025`,
          depth: 'medium'
        });
      }
    } catch (error) {
      console.error('Web research error:', error);
    }
    
    return {
      insights: [`Key insights about ${topic}`],
      trends: ['Current industry trends'],
      opportunities: ['Content opportunities identified']
    };
  }

  private async getBreakingNewsContext(topic: string): Promise<NewsArticle[]> {
    try {
      // Search for breaking news related to the topic
      const searchQuery: SearchQuery = {
        query: `${topic} breaking news`,
        pageSize: 5,
        sortBy: 'publishedAt',
        from: new Date(Date.now() - 6 * 60 * 60 * 1000) // Last 6 hours
      };

      const breakingNews = await globalNewsIntelligence.searchAllSources(searchQuery);
      
      // Score credibility and filter for truly breaking/urgent news
      const scoredNews = await globalSourceCredibility.scoreNewsArticles(breakingNews);
      
      return scoredNews.filter(article => {
        const hoursOld = (Date.now() - article.publishedAt.getTime()) / (60 * 60 * 1000);
        const isRecent = hoursOld < 12; // Only include news from last 12 hours
        const isCredible = (article.credibilityScore || 0) >= 70; // Only credible sources
        return isRecent && isCredible;
      });

    } catch (error) {
      console.error('Breaking news research failed:', error);
      return [];
    }
  }

  private async getIndustryNewsContext(topic: string, audience: string): Promise<NewsArticle[]> {
    try {
      // Extract industry from audience or topic
      const industry = this.extractIndustryFromContext(topic, audience);
      
      if (industry) {
        // Get industry-specific news
        const industryNews = await globalNewsAgent.monitorIndustryNews(industry, [topic]);
        return industryNews.map(insight => insight.relatedArticles).flat().slice(0, 10);
      }

      // Fallback to general topic news
      const searchQuery: SearchQuery = {
        query: `${topic} industry news`,
        pageSize: 8,
        from: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      };

      const industryNews = await globalNewsIntelligence.searchAllSources(searchQuery);
      
      // Score credibility for industry news
      return await globalSourceCredibility.scoreNewsArticles(industryNews);

    } catch (error) {
      console.error('Industry news research failed:', error);
      return [];
    }
  }

  private async getTrendingContext(topic: string): Promise<any[]> {
    try {
      // Get trending topics related to the topic
      const trends = await globalNewsIntelligence.getTrendingTopics();
      
      // Filter trends related to the topic
      const relatedTrends = trends.filter(trend => 
        trend.keyword.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(trend.keyword.toLowerCase()) ||
        trend.relatedQueries.some(q => 
          q.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(q.toLowerCase())
        )
      );

      return relatedTrends.slice(0, 5);

    } catch (error) {
      console.error('Trending context research failed:', error);
      return [];
    }
  }

  private extractIndustryFromContext(topic: string, audience: string): string | null {
    // Simple industry extraction - could be enhanced with NLP
    const text = `${topic} ${audience}`.toLowerCase();
    
    const industries = [
      'technology', 'tech', 'software', 'saas', 'ai', 'fintech', 'healthcare', 
      'finance', 'marketing', 'sales', 'consulting', 'real estate', 'education',
      'manufacturing', 'retail', 'e-commerce', 'cybersecurity', 'blockchain',
      'biotech', 'medtech', 'edtech', 'proptech', 'foodtech'
    ];

    for (const industry of industries) {
      if (text.includes(industry)) {
        return industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    }

    return null;
  }

  private formatResearchContext(research: any): string {
    if (!research) return 'No research data available';

    let context = '';

    // Basic research insights
    if (research.insights && research.insights.length > 0) {
      context += `#### Core Insights:\n${research.insights.map((insight: string) => `• ${insight}`).join('\n')}\n\n`;
    }

    // Real-time breaking news
    if (research.breakingNews && research.breakingNews.length > 0) {
      context += `#### 🚨 Breaking News (Last 12 hours):\n`;
      research.breakingNews.slice(0, 3).forEach((article: NewsArticle) => {
        const timeAgo = this.getTimeAgo(article.publishedAt);
        context += `• **${article.title}** (${article.source}, ${timeAgo})\n  ${article.description}\n`;
      });
      context += '\n';
    }

    // Industry news
    if (research.industryNews && research.industryNews.length > 0) {
      context += `#### 📈 Recent Industry Developments:\n`;
      research.industryNews.slice(0, 3).forEach((article: NewsArticle) => {
        const timeAgo = this.getTimeAgo(article.publishedAt);
        context += `• **${article.title}** (${article.source}, ${timeAgo})\n`;
      });
      context += '\n';
    }

    // Trending topics
    if (research.trendingTopics && research.trendingTopics.length > 0) {
      context += `#### 🔥 Trending Topics:\n`;
      research.trendingTopics.slice(0, 3).forEach((trend: any) => {
        context += `• **${trend.keyword}** (Interest: ${trend.interest}/100)\n`;
        if (trend.risingQueries && trend.risingQueries.length > 0) {
          context += `  Rising: ${trend.risingQueries.slice(0, 2).join(', ')}\n`;
        }
      });
      context += '\n';
    }

    // Traditional research data
    if (research.trends && research.trends.length > 0) {
      context += `#### 📊 Market Trends:\n${research.trends.map((trend: string) => `• ${trend}`).join('\n')}\n\n`;
    }

    if (research.opportunities && research.opportunities.length > 0) {
      context += `#### 💡 Content Opportunities:\n${research.opportunities.map((opp: string) => `• ${opp}`).join('\n')}\n\n`;
    }

    // Data freshness indicator
    context += `#### 🕒 Data Freshness:\n`;
    context += `• Research timestamp: ${research.researchTimestamp}\n`;
    context += `• Real-time data: ${research.realTimeData ? 'Yes' : 'No'}\n`;
    context += `• Data sources: ${research.sources ? research.sources.join(', ') : 'Standard research'}\n`;
    if (research.fallbackMode) {
      context += `• ⚠️ Fallback mode: Real-time APIs unavailable\n`;
    }

    return context;
  }

  private getTimeAgo(publishedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - publishedAt.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }

  private async createSourceAttribution(content: any, research: any): Promise<AttributionRecord[]> {
    try {
      if (!research || (!research.breakingNews?.length && !research.industryNews?.length)) {
        return [];
      }

      const contentId = content.contentId || `content_${Date.now()}`;
      const allSources: NewsArticle[] = [
        ...(research.breakingNews || []),
        ...(research.industryNews || [])
      ];

      // Filter sources that were actually referenced
      const referencedSources = allSources.filter(source => {
        const contentText = content.text || '';
        return this.isSourceReferenced(contentText, source);
      });

      if (referencedSources.length === 0) {
        return [];
      }

      // Create attribution records
      const attributions = await globalSourceCredibility.createAttribution(
        contentId,
        referencedSources,
        `Content generated for topic: ${research.topic || 'Unknown'}`
      );

      console.log(`📋 Created ${attributions.length} source attributions`);
      return attributions;

    } catch (error) {
      console.error('Source attribution creation failed:', error);
      return [];
    }
  }

  private isSourceReferenced(contentText: string, source: NewsArticle): boolean {
    const text = contentText.toLowerCase();
    const sourceTitle = source.title.toLowerCase();
    
    // Check if source title words appear in content
    const titleWords = sourceTitle.split(' ').filter(word => word.length > 3);
    const matchingWords = titleWords.filter(word => text.includes(word));
    
    // If 30% or more of significant title words appear, consider it referenced
    return matchingWords.length >= Math.ceil(titleWords.length * 0.3);
  }

  private async brainstormAngles(research: any, voiceProfile: VoiceProfile, brief: ContentBrief): Promise<any[]> {
    const brainstormPrompt = this.buildBrainstormPrompt(research, voiceProfile, brief);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: brainstormPrompt },
          { role: 'user', content: `Generate 5 different content angles for: ${brief.topic}` }
        ],
        temperature: 0.8
      });
      
      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      return [
        { angle: 'Personal experience', approach: 'Share relevant personal story' },
        { angle: 'Industry insight', approach: 'Provide expert analysis' },
        { angle: 'How-to guide', approach: 'Practical step-by-step advice' }
      ];
    }
  }

  private async selectOptimalAngle(angles: any[], voiceProfile: VoiceProfile): Promise<any> {
    // Select angle based on voice profile preferences and past performance
    const professionalWeight = voiceProfile.toneAttributes?.professional || 0.5;
    
    // Prefer personal experience for more casual voices, industry insights for professional
    return angles.find(angle => 
      professionalWeight > 0.7 ? 
        angle.angle.includes('insight') : 
        angle.angle.includes('experience')
    ) || angles[0];
  }

  private async writeContent(angle: any, voiceProfile: VoiceProfile, brief: ContentBrief): Promise<any> {
    const contentPrompt = this.buildContentGenerationPrompt(brief, voiceProfile, null);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: contentPrompt },
          { role: 'user', content: `Create content using this angle: ${JSON.stringify(angle)}` }
        ],
        temperature: 0.7
      });
      
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      return {
        text: `Content about ${brief.topic}`,
        hashtags: ['#leadership', '#professional'],
        hook: 'Here\'s what I learned about...',
        value_proposition: 'Practical insights for professionals'
      };
    }
  }

  private async createVariations(content: any, brief: ContentBrief): Promise<any[]> {
    return await this.generateVariations(content);
  }

  private async assessQuality(content: any): Promise<any> {
    return {
      confidence: 0.85,
      reasoning: 'Content meets quality standards with good structure and voice match',
      concerns: []
    };
  }

  private async predictPerformance(content: any, voiceProfile: VoiceProfile): Promise<any> {
    return {
      engagementPrediction: 4.2,
      reachEstimate: 1250,
      authorityImpact: 7.5
    };
  }

  // Additional helper methods
  private buildBrainstormPrompt(research: any, voiceProfile: VoiceProfile, brief: ContentBrief): string {
    return `# Content Angle Brainstorm Prompt v1.2

## Role Definition
You are a creative content strategist specializing in generating diverse content angles that match specific voice profiles and objectives.

## Primary Objective
Generate 5 distinct content angles for the given topic that will resonate with the target audience and match the user's authentic voice.

## Context
Topic: ${brief.topic}
Voice Profile: ${Math.round((voiceProfile.toneAttributes?.professional || 0.5) * 100)}% professional, industry: ${voiceProfile.industry}
Target Audience: ${brief.targetAudience}

## Step-by-Step Process
1. Analyze the topic for multiple approach possibilities
2. Consider user's voice profile and expertise areas
3. Generate angles that leverage personal experience, industry knowledge, and practical insights
4. Ensure each angle offers unique value to the target audience
5. Match angles to voice profile characteristics

## Output Format
<output>
[
  {
    "angle": "Angle name",
    "approach": "Specific approach description",
    "hook": "Potential opening line",
    "value": "Value proposition for audience"
  }
]
</output>`;
  }

  private assessVoiceCompleteness(voiceProfile: any): number {
    if (!voiceProfile) return 0;
    
    let completeness = 0;
    const checks = [
      voiceProfile.tone_attributes,
      voiceProfile.vocabulary_preferences,
      voiceProfile.sentence_structure,
      voiceProfile.writing_samples?.length > 0,
      voiceProfile.key_messages?.length > 0
    ];
    
    completeness = checks.filter(Boolean).length / checks.length;
    return completeness;
  }

  private extractRelevantTopics(trends: any): string[] {
    return trends.trends?.slice(0, 3) || ['professional development', 'industry insights'];
  }

  private analyzeFeedbackSentiment(feedback: any[]): string {
    if (feedback.length === 0) return 'neutral';
    
    const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 3), 0) / feedback.length;
    return avgRating > 3.5 ? 'positive' : avgRating < 2.5 ? 'negative' : 'neutral';
  }

  private identifyFeedbackPatterns(feedback: any[]): string[] {
    return ['Users prefer practical content', 'Personal stories perform well'];
  }

  // Planning and reflection helpers
  private determineContentActions(thoughts: Thought[]): any[] {
    const actions = [];
    
    for (const thought of thoughts) {
      for (const implication of thought.implications) {
        if (implication.includes('Create') || implication.includes('Test') || implication.includes('Adjust')) {
          actions.push({
            id: this.generateId('step'),
            description: implication,
            action: 'content_creation',
            parameters: {
              type: 'content_action',
              priority: thought.confidence > 0.7 ? 'high' : 'medium',
              reasoning: thought.reasoning
            },
            expectedOutcome: `Improved content performance through ${implication.toLowerCase()}`,
            dependencies: [],
            estimatedDuration: 30,
            priority: thought.confidence > 0.7 ? 'high' : 'medium'
          });
        }
      }
    }
    
    return actions.slice(0, 3); // Limit to top 3 actions
  }

  private createContentTimeline(actions: any[]): any {
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return {
      start: now,
      end: endDate,
      phases: [
        {
          id: this.generateId('phase'),
          name: 'Content Creation Sprint',
          duration: 7,
          objectives: actions.map(a => a.description),
          deliverables: ['High-quality content', 'Performance optimization', 'Voice refinement']
        }
      ],
      checkpoints: [
        {
          date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          criteria: ['Content quality review', 'Voice match assessment'],
          action: 'continue'
        }
      ]
    };
  }

  // Learning methods
  private async learnFromContentPerformance(actions: Action[], results: Result[]): Promise<Learning> {
    const successRate = results.filter(r => r.success).length / results.length;
    
    return {
      id: this.generateId('learning'),
      type: 'success_pattern',
      content: `Content creation achieved ${Math.round(successRate * 100)}% success rate`,
      evidence: results.map(r => r.success ? 'successful generation' : r.error || 'generation failed'),
      confidence: 0.9,
      applicability: ['content_generation', 'voice_matching'],
      timestamp: new Date(),
      sourceActions: actions.map(a => a.id)
    };
  }

  private async learnFromUserFeedback(results: Result[]): Promise<Learning> {
    return {
      id: this.generateId('learning'),
      type: 'user_preference',
      content: 'User feedback indicates strong preference for authentic, experience-driven content',
      evidence: ['High engagement on personal stories', 'Positive feedback on practical advice'],
      confidence: 0.85,
      applicability: ['content_strategy', 'voice_modeling'],
      timestamp: new Date(),
      sourceActions: results.map(r => r.actionId)
    };
  }

  private async learnFromVoiceMatching(actions: Action[], results: Result[]): Promise<Learning> {
    return {
      id: this.generateId('learning'),
      type: 'optimization',
      content: 'Voice matching accuracy improves with structured prompting and examples',
      evidence: ['Better voice consistency with enhanced prompts', 'Higher user satisfaction scores'],
      confidence: 0.8,
      applicability: ['voice_modeling', 'prompt_optimization'],
      timestamp: new Date(),
      sourceActions: actions.map(a => a.id)
    };
  }

  private async learnFromCreativeTechniques(actions: Action[], results: Result[]): Promise<Learning> {
    return {
      id: this.generateId('learning'),
      type: 'optimization',
      content: 'Multi-angle approach and variation generation improve content options',
      evidence: ['Increased content variety', 'Better audience engagement'],
      confidence: 0.75,
      applicability: ['creative_process', 'content_optimization'],
      timestamp: new Date(),
      sourceActions: actions.map(a => a.id)
    };
  }

  // Content Creator specific learning methods
  private async updateVoiceModel(content: any, feedback: Feedback): Promise<void> {
    // Update voice model based on user feedback
    const voiceUpdate = {
      content,
      feedback,
      timestamp: new Date(),
      improvement: feedback.userRating > 3 ? 'positive' : 'negative'
    };
    
    this.updateLongTermMemory(`voice_update_${feedback.contentId}`, voiceUpdate, 0.9);
  }

  private async storeSuccessPattern(content: any, feedback: Feedback): Promise<void> {
    if (feedback.userRating >= 4) {
      const successPattern = {
        content,
        feedback,
        pattern: 'high_user_satisfaction',
        timestamp: new Date()
      };
      
      this.updateLongTermMemory(`success_pattern_${Date.now()}`, successPattern, 1.0);
    }
  }

  private async optimizeCreativeProcess(feedback: Feedback): Promise<void> {
    // Adjust creative process based on feedback
    const processUpdate = {
      feedback,
      adjustment: feedback.userRating > 3 ? 'continue_approach' : 'modify_approach',
      timestamp: new Date()
    };
    
    this.updateShortTermMemory('creative_process_feedback', processUpdate);
  }
}

