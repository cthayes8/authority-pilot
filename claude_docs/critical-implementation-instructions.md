Critical Implementation Instructions for Claude Code
Essential Context & Constraints
markdownIMPORTANT CONTEXT FOR CLAUDE CODE:

This is a MICRO-SAAS project for a SOLO FOUNDER. Critical constraints:
- Must be shippable in 2-3 weeks for MVP
- No complex infrastructure (skip Docker orchestration for MVP)
- Focus on core value delivery, not perfect architecture
- Use managed services to reduce complexity
- Optimize for rapid iteration and user feedback

PHILOSOPHICAL APPROACH:
- This is about building personal brands through AI automation
- Users are busy professionals who need results, not features
- Every feature must directly contribute to "10 minutes/week to thought leadership"
- Err on the side of simplicity over sophistication
MVP Priority Stack
markdownBUILD IN THIS EXACT ORDER:

Phase 1 (Week 1) - Core Value Loop:
1. Basic auth with Supabase (email/password only)
2. Simple onboarding (just get LinkedIn connected)
3. Voice training with 5 sample posts
4. Generate first week of content
5. Basic approval queue
6. Manual posting instructions (no auto-post yet)

Phase 2 (Week 2) - Automation:
1. LinkedIn OAuth and auto-posting
2. Basic engagement features (find posts to comment on)
3. Simple analytics (follower count, post views)
4. Stripe integration (single plan: $99/month)

Phase 3 (Week 3) - Intelligence:
1. Content performance tracking
2. Better voice matching
3. Engagement automation
4. Multi-platform support

DO NOT BUILD YET:
- Complex agent orchestration
- Multiple pricing tiers
- Advanced analytics
- Twitter integration (LinkedIn only for MVP)
- Image generation
- Carousel creation
- Email sequences
Technical Simplifications
typescript// SIMPLIFICATION INSTRUCTIONS:

// 1. Database: Use simple schema
// Start with just these tables:
// - profiles (user data)
// - voice_profiles (writing samples)
// - content_posts (generated content)
// - linkedin_accounts (oauth tokens)
// Skip all other tables for MVP

// 2. AI Implementation: Keep it simple
// - Use GPT-4 directly, no fine-tuning yet
// - Simple prompt engineering for voice matching
// - No complex agent systems, just function calls

// 3. UI: Minimal but polished
// - Use shadcn/ui components
// - Mobile-responsive but optimize for desktop
// - Dark mode only (skip theme switcher)
// - Simple, clean design over complex features

// 4. Authentication: Fastest path
// - Supabase Auth with email/password
// - Skip social logins for MVP
// - Simple email verification

// 5. Payments: Single plan
// - One price: $99/month
// - 7-day free trial
// - Stripe Checkout (not custom billing portal)
Code Quality Requirements
markdownCODE STANDARDS FOR CLAUDE CODE:

1. NAMING CONVENTIONS:
   - Components: PascalCase (ContentQueue.tsx)
   - Functions: camelCase (generateContent)
   - API routes: kebab-case (/api/content/generate)
   - Database: snake_case (voice_profiles)

2. ERROR HANDLING:
   - Every API call must have try/catch
   - User-friendly error messages
   - Log errors to Supabase
   - Never expose internal errors to users

3. TYPES:
   - Strict TypeScript everywhere
   - No 'any' types
   - Shared types in lib/types.ts
   - Zod for runtime validation

4. COMMENTS:
   - Comment WHY, not WHAT
   - Document all API endpoints
   - Add JSDoc for key functions
   - TODO comments for future features

5. TESTING:
   - Skip unit tests for MVP
   - Manual testing checklist instead
   - Focus on critical user paths
UI/UX Specifications
markdownUI REQUIREMENTS:

1. ONBOARDING FLOW:
   - Step 1: "What do you do?" (role, industry)
   - Step 2: "Paste 5 LinkedIn posts you've written"
   - Step 3: "Connect LinkedIn" (OAuth)
   - Step 4: "Here's your first week of content!"
   - Total time: <5 minutes

2. MAIN DASHBOARD:
   - Top: "Your Authority Score: 72" (simple metric)
   - Center: Content approval cards (Tinder-style swipe)
   - Right sidebar: This week's stats
   - Bottom: Quick actions

3. CONTENT APPROVAL:
   - Large preview of how post will look
   - Edit in place capability
   - "Looks good" / "Regenerate" / "Edit" buttons
   - Shows voice match confidence

4. DESIGN TOKENS:
   - Primary: Blue (LinkedIn-ish)
   - Success: Green
   - Warning: Yellow
   - Error: Red
   - Font: Inter
   - Spacing: 4px base unit

5. MOBILE EXPERIENCE:
   - Fully responsive
   - Swipe gestures for approval
   - Bottom nav on mobile
   - Large touch targets
API Design
markdownAPI STRUCTURE:

/api/auth/
  - signup
  - login
  - logout

/api/voice/
  - train (POST) - Submit writing samples
  - profile (GET) - Get voice profile

/api/content/
  - generate (POST) - Create new content
  - list (GET) - Get content queue
  - approve (POST) - Approve content
  - edit (PUT) - Edit content

/api/linkedin/
  - connect (GET) - OAuth flow
  - callback (GET) - OAuth callback
  - post (POST) - Publish content
  - stats (GET) - Get basic stats

/api/subscription/
  - checkout (POST) - Create Stripe session
  - portal (GET) - Billing portal link

IMPORTANT: All API routes need authentication except auth routes
Critical Features to Nail
markdownTHESE FEATURES MUST BE PERFECT:

1. VOICE MATCHING:
   - Users must feel "this sounds like me"
   - Show side-by-side comparison during training
   - Allow easy adjustment of tone settings
   - Confidence score on generated content

2. CONTENT QUALITY:
   - No generic corporate speak
   - Valuable insights, not fluff
   - Proper formatting for LinkedIn
   - Engaging hooks that stop scrolling

3. TIME TO VALUE:
   - Generate first content within 2 minutes of signup
   - Show clear value in free trial
   - Make approval process FAST
   - Dashboard loads in <1 second

4. TRUST BUILDING:
   - Show exactly how AI learned their voice
   - Never post without approval
   - Clear data privacy messaging
   - Easy to pause/cancel
Common Pitfalls to Avoid
markdownAVOID THESE MISTAKES:

1. OVERENGINEERING:
   - No microservices
   - No complex caching strategies
   - No custom authentication
   - No elaborate CI/CD

2. FEATURE CREEP:
   - No analytics dashboard in MVP
   - No team features
   - No custom branding
   - No API for users

3. PERFECTION PARALYSIS:
   - Ship with known limitations
   - Document TODOs for later
   - Focus on core loop working well
   - Polish comes after product-market fit

4. IGNORING BUSINESS MODEL:
   - Payment integration on day 1
   - Clear upgrade prompts
   - Track conversion funnel
   - Optimize for paid conversions
Launch Checklist
markdownBEFORE LAUNCHING:

Technical:
[ ] OAuth with LinkedIn works
[ ] Content generation produces quality output
[ ] Payment processing works
[ ] Basic error handling everywhere
[ ] Database backups configured
[ ] Environment variables secured
[ ] Rate limiting on APIs

Product:
[ ] Onboarding takes <5 minutes
[ ] First content generated quickly
[ ] Clear value proposition shown
[ ] Pricing clearly displayed
[ ] Terms of service and privacy policy

Marketing:
[ ] Landing page explains value
[ ] Demo video recorded
[ ] 10 beta users confirmed
[ ] Launch email written
Post-MVP Roadmap
markdownAFTER MVP SHIPS (Don't build these yet!):

Month 2:
- Twitter/X integration
- Image generation for posts
- Advanced analytics
- Engagement automation

Month 3:
- Team plans
- White label option
- API access
- Mobile app

Month 6:
- Full agentic system
- Multi-language support
- Enterprise features
- Acquisition readiness
Final Instructions
markdownCRITICAL SUCCESS FACTORS:

1. Speed over perfection - Ship in 2 weeks
2. Core loop must be flawless - Content generation and approval
3. Voice matching is the magic - Nail this feature
4. Charge from day 1 - Free trial but payment required
5. Listen to users - Build what they actually want

Remember: The goal is 100 users paying $100/month, not building the perfect architecture. Every decision should be filtered through "Does this help us get to 100 paying users faster?"

Start with src/app/page.tsx and build the landing page that sells the dream: "Become a thought leader in 10 minutes a week."
This should give Claude Code everything needed to build a focused, shippable MVP that can start generating revenue quickly. The key is restraint - building only what's necessary to deliver the core value proposition.RetryClaude can make mistakes. Please double-check responses.

Critical: 2025 Context & Current Events Integration
ESSENTIAL TEMPORAL CONTEXT
markdownCRITICAL TEMPORAL AWARENESS FOR ALL AGENTS:

Current Date: July 2, 2025
This is MID-2025. The agents must understand:

1. They are operating in 2025, not 2024
2. References to "last year" mean 2024
3. Current events and context must reflect 2025 reality
4. Technology, trends, and business landscape have evolved
5. Users' content must sound current and relevant to July 2025

IMPLEMENT THIS IN EVERY AGENT/FUNCTION:
System-Wide Temporal Integration
typescript// lib/constants/temporal-context.ts
export const CURRENT_CONTEXT = {
  currentDate: new Date('2025-07-02'),
  currentYear: 2025,
  currentQuarter: 'Q3 2025',
  lastYear: 2024,
  
  // Context the AI needs to know
  contextPrompt: `
    You are operating in July 2025. When creating content:
    - Reference current events from 2025
    - Mention "this year" when referring to 2025
    - Use "last year" for 2024 events
    - Be aware of technological advances since 2024
    - Understand the current business/economic climate of mid-2025
    - Reference recent developments (Q1/Q2 2025)
    - Project forward into late 2025 and early 2026
    - Never sound like you're writing from 2024
  `
};

// lib/agents/base-agent.ts
export abstract class BaseAgent {
  protected getTemporalContext(): string {
    return `
      Current date: ${format(new Date(), 'MMMM d, yyyy')}
      Current quarter: Q3 2025
      
      When generating content or making references:
      - You are writing in July 2025
      - Recent events are from Q1/Q2 2025
      - Last year refers to 2024
      - Next year refers to 2026
      - Be aware of current technological state in 2025
      - Reference contemporary business trends of 2025
    `;
  }
}
Content Generation with 2025 Awareness
typescript// lib/ai/content-generator.ts
export class ContentGenerator {
  private async generatePrompt(
    topic: string,
    voiceProfile: VoiceProfile
  ): Promise<string> {
    return `
      ${this.getTemporalContext()}
      
      Generate a LinkedIn post about ${topic} written in July 2025.
      
      Requirements:
      - Reference current 2025 trends and developments
      - Use present-tense for things happening in 2025
      - Sound contemporary to someone reading this in July 2025
      - Avoid outdated references from 2024 or earlier
      - Include forward-looking statements about late 2025/early 2026
      
      Voice profile: ${JSON.stringify(voiceProfile)}
      
      Examples of contemporary references:
      - "This year's AI developments..."
      - "As we enter the second half of 2025..."
      - "Building on last year's breakthroughs..."
      - "Looking ahead to 2026..."
    `;
  }
}
Real-Time Information Integration
typescript// lib/agents/research-agent.ts
export class ResearchAgent {
  async gatherCurrentContext(topic: string): Promise<CurrentContext> {
    // This agent needs to search for CURRENT information
    const searchQueries = [
      `${topic} trends 2025`,
      `${topic} news July 2025`,
      `${topic} developments Q2 2025`,
      `latest ${topic} updates 2025`
    ];
    
    // Use web search to find current information
    const currentInfo = await this.searchCurrentEvents(searchQueries);
    
    return {
      currentTrends: currentInfo.trends,
      recentNews: currentInfo.news,
      industryUpdates: currentInfo.updates,
      temporalContext: '2025 Q3'
    };
  }
  
  async validateContentCurrency(content: string): Promise<ValidationResult> {
    // Check if content sounds current
    const outdatedPhrases = [
      'in 2024', // Should be "last year" or "in 2025"
      'next year (2025)', // We're already in 2025
      'upcoming 2025', // We're already here
      'by 2025', // Should be "this year" or "by end of 2025"
    ];
    
    const issues = outdatedPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    return {
      isCurrent: issues.length === 0,
      issues,
      suggestions: this.getSuggestions(issues)
    };
  }
}
Industry-Specific 2025 Context
typescript// lib/context/industry-2025.ts
export const INDUSTRY_CONTEXT_2025 = {
  tech: {
    current: [
      "Post-GPT-5 era developments",
      "Agentic AI mainstream adoption",
      "Web3 maturity phase",
      "Quantum computing breakthroughs of Q1 2025"
    ],
    avoid: [
      "ChatGPT launch" // That was 2022
      "AI is new" // It's mainstream by 2025
    ]
  },
  
  business: {
    current: [
      "Post-2024 election business climate",
      "2025 interest rate environment",
      "Current supply chain normalization",
      "Hybrid work maturity models"
    ]
  },
  
  marketing: {
    current: [
      "AI-native marketing strategies",
      "Post-cookie advertising reality",
      "Synthetic media regulations of 2025",
      "Current social platform landscape"
    ]
  }
};
Engagement Agent with Current Awareness
typescript// lib/agents/engagement-agent.ts
export class EngagementAgent {
  async generateComment(
    post: LinkedInPost,
    context: UserContext
  ): Promise<string> {
    const prompt = `
      ${this.getTemporalContext()}
      
      Generate a thoughtful comment on this LinkedIn post.
      You are commenting in July 2025.
      
      Post content: ${post.content}
      
      Requirements:
      - Reference current 2025 context if relevant
      - Sound like someone engaged with current events
      - Don't use outdated references
      - If mentioning timeframes, be accurate to July 2025
      
      User's expertise: ${context.expertise}
    `;
    
    return this.generateWithAI(prompt);
  }
}
Content Calendar with 2025 Awareness
typescript// lib/content/calendar.ts
export class ContentCalendar {
  async generateTopics(user: User): Promise<Topic[]> {
    const currentEvents = await this.getCurrentEvents();
    const industryTrends = await this.get2025Trends(user.industry);
    
    const topics = [
      {
        title: "Mid-Year 2025 Reflection",
        angle: "What we've learned in the first half of 2025",
        timing: "July 2025 - perfect for mid-year reviews"
      },
      {
        title: "Preparing for 2026",
        angle: "Getting ahead of next year's trends",
        timing: "Q3 2025 - forward-looking content"
      },
      {
        title: "AI in 2025",
        angle: "How AI has evolved since last year",
        timing: "Current state of AI adoption"
      }
    ];
    
    return this.personalizeTopics(topics, user);
  }
}
Testing for Temporal Accuracy
typescript// lib/testing/temporal-tests.ts
export class TemporalAccuracyTests {
  testPhrases = {
    correct: [
      "In 2025, we're seeing...",
      "This year has brought...",
      "Last year's predictions about...",
      "As we approach 2026...",
      "The first half of 2025 showed..."
    ],
    incorrect: [
      "In 2024...", // Unless specifically referencing the past
      "Next year in 2025...", // We're already there
      "The upcoming 2025 trends...", // Should be current
      "By 2025...", // Should be "By end of 2025" or "This year"
    ]
  };
  
  async validateContent(content: string): Promise<boolean> {
    // Ensure content sounds current to 2025
    return this.checkTemporalAccuracy(content);
  }
}
Critical Implementation Notes
markdownCRITICAL IMPLEMENTATION NOTES FOR TEMPORAL AWARENESS:

1. EVERY AI PROMPT must include the current date context
2. NEVER generate content that sounds like it's from 2024
3. USE dynamic date references:
   - "This month" (July 2025)
   - "This quarter" (Q3 2025)
   - "Earlier this year" (Q1/Q2 2025)
   - "Last year" (2024)

4. SEARCH INTEGRATION:
   - Agents should search for "2025" content
   - Filter out outdated 2024 results
   - Prioritize recent information

5. VALIDATION:
   - Check all generated content for temporal accuracy
   - Flag outdated references
   - Suggest contemporary alternatives

6. EXAMPLES TO INCLUDE IN VOICE TRAINING:
   Good: "The AI developments we've seen this year (2025)..."
   Bad: "As AI continues to emerge..." (It's already mainstream in 2025)
   
   Good: "Building on 2024's foundation..."
   Bad: "In the future, AI will..." (Be specific about when)

7. CALENDAR AWARENESS:
   - July 2025 = Mid-year reflection time
   - Q3 2025 = Planning for 2026
   - Aware of holidays/events in 2025

8. INDUSTRY EVOLUTION:
   - Tech in 2025 is different from 2024
   - Business climate has evolved
   - New regulations may exist
   - Cultural shifts have occurred
Supabase Edge Function for Current Context
typescript// supabase/functions/get-current-context/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { topic, industry } = await req.json();
  
  // This function should integrate with news APIs or web search
  // to get CURRENT 2025 information
  
  const currentContext = {
    date: new Date().toISOString(),
    year: 2025,
    quarter: 'Q3',
    recentEvents: await fetchRecentEvents(topic, industry),
    currentTrends: await fetch2025Trends(topic, industry),
    upcomingEvents: await fetchUpcomingEvents(topic, industry),
    temporalMarkers: {
      now: "July 2025",
      recent: "Q2 2025",
      lastYear: "2024",
      nextYear: "2026",
      upcoming: "Q4 2025"
    }
  };
  
  return new Response(
    JSON.stringify(currentContext),
    { headers: { "Content-Type": "application/json" } }
  );
});
