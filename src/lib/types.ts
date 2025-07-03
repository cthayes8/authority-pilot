// Core Types for AuthorityPilot
// Following naming conventions: camelCase for TypeScript, snake_case for database

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  company?: string;
  role?: string;
  industry?: string;
  timezone: string;
  subscriptionTier: 'free' | 'starter' | 'professional' | 'executive';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due';
  stripeCustomerId?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceProfile {
  id: string;
  userId: string;
  writingSamples: string[];
  toneAttributes: {
    professional: number;
    casual: number;
    humorous: number;
    inspirational: number;
    educational: number;
  };
  vocabularyPreferences: {
    use: string[];
    avoid: string[];
  };
  sentenceStructure: {
    averageLength: number;
    complexity: 'simple' | 'medium' | 'complex';
    paragraphLength: number;
  };
  emojiUsage: {
    frequency: 'none' | 'low' | 'medium' | 'high';
    preferred: string[];
  };
  hashtagStyle: {
    count: number;
    placement: 'inline' | 'end' | 'both';
    format: 'lowercase' | 'camelCase' | 'mixed';
  };
  industryJargon?: Record<string, any>;
  keyMessages: string[];
  brandPersonality?: Record<string, any>;
  lastTrainedAt?: string;
  trainingVersion: number;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  userId: string;
  contentType: 'post' | 'article' | 'thread' | 'carousel';
  platform: 'linkedin' | 'twitter';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  content: {
    text: string;
    hashtags?: string[];
    mentions?: string[];
    mediaUrls?: string[];
  };
  aiGenerated: boolean;
  userEdited: boolean;
  scheduledFor?: string;
  publishedAt?: string;
  platformPostId?: string;
  performanceMetrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagementRate?: number;
  };
  aiConfidenceScore: number;
  generationPrompt?: string;
  voiceProfileVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInAccount {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  accessToken: string; // This will be encrypted
  refreshToken?: string; // This will be encrypted
  tokenExpiresAt?: string;
  isActive: boolean;
  followerCount?: number;
  connectionCount?: number;
  postCount?: number;
  engagementRate?: number;
  lastSyncedAt?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Content Generation Types
export interface ContentGenerationRequest {
  topic?: string;
  contentType: 'post' | 'article' | 'thread';
  platform: 'linkedin' | 'twitter';
  voiceProfileId: string;
  customPrompt?: string;
}

export interface GeneratedContent {
  text: string;
  confidence: number;
  variations?: string[];
  hashtags: string[];
  estimatedReach?: number;
  engagementPrediction?: number;
}

// Onboarding Types
export interface OnboardingData {
  step: number;
  profile: {
    fullName: string;
    role: string;
    company?: string;
    industry: string;
    expertise?: string;
    targetAudience?: string;
  };
  writingSamples?: string[];
  linkedinConnected?: boolean;
  contentPreferences?: {
    topics: string[];
    avoidTopics: string[];
    postingFrequency: number;
  };
}

// Analytics Types
export interface AnalyticsData {
  authorityScore: number;
  followerGrowth: {
    current: number;
    change: number;
    percentage: number;
  };
  engagementStats: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    averageEngagementRate: number;
  };
  contentPerformance: {
    topPosts: ContentPost[];
    worstPosts: ContentPost[];
    bestTimes: string[];
  };
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  limits: {
    postsPerWeek: number | 'unlimited';
    platforms: number | 'unlimited';
    engagementActions: number;
    voiceTraining: 'basic' | 'advanced' | 'premium';
    analytics?: 'basic' | 'advanced' | 'premium';
    support?: 'standard' | 'priority';
  };
}

// Error Types
export class AuthorityPilotError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AuthorityPilotError';
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;