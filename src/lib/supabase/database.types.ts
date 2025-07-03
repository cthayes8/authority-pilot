// Database types for AuthorityPilot
// This file is generated based on the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company: string | null;
          role: string | null;
          industry: string | null;
          timezone: string;
          subscription_tier: string;
          subscription_status: string;
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          industry?: string | null;
          timezone?: string;
          subscription_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          industry?: string | null;
          timezone?: string;
          subscription_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_profiles: {
        Row: {
          id: string;
          user_id: string;
          writing_samples: string[];
          tone_attributes: Json;
          vocabulary_preferences: Json;
          sentence_structure: Json;
          emoji_usage: Json;
          hashtag_style: Json;
          industry_jargon: Json | null;
          key_messages: string[];
          brand_personality: Json | null;
          last_trained_at: string | null;
          training_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          writing_samples: string[];
          tone_attributes: Json;
          vocabulary_preferences: Json;
          sentence_structure: Json;
          emoji_usage: Json;
          hashtag_style: Json;
          industry_jargon?: Json | null;
          key_messages: string[];
          brand_personality?: Json | null;
          last_trained_at?: string | null;
          training_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          writing_samples?: string[];
          tone_attributes?: Json;
          vocabulary_preferences?: Json;
          sentence_structure?: Json;
          emoji_usage?: Json;
          hashtag_style?: Json;
          industry_jargon?: Json | null;
          key_messages?: string[];
          brand_personality?: Json | null;
          last_trained_at?: string | null;
          training_version?: number;
          created_at?: string;
        };
      };
      content_posts: {
        Row: {
          id: string;
          user_id: string;
          content_type: string;
          platform: string;
          status: string;
          content: Json;
          ai_generated: boolean;
          user_edited: boolean;
          scheduled_for: string | null;
          published_at: string | null;
          platform_post_id: string | null;
          performance_metrics: Json | null;
          ai_confidence_score: number;
          generation_prompt: string | null;
          voice_profile_version: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: string;
          platform: string;
          status?: string;
          content: Json;
          ai_generated?: boolean;
          user_edited?: boolean;
          scheduled_for?: string | null;
          published_at?: string | null;
          platform_post_id?: string | null;
          performance_metrics?: Json | null;
          ai_confidence_score: number;
          generation_prompt?: string | null;
          voice_profile_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: string;
          platform?: string;
          status?: string;
          content?: Json;
          ai_generated?: boolean;
          user_edited?: boolean;
          scheduled_for?: string | null;
          published_at?: string | null;
          platform_post_id?: string | null;
          performance_metrics?: Json | null;
          ai_confidence_score?: number;
          generation_prompt?: string | null;
          voice_profile_version?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      linkedin_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          account_name: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          is_active: boolean;
          follower_count: number | null;
          connection_count: number | null;
          post_count: number | null;
          engagement_rate: number | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          account_name?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          follower_count?: number | null;
          connection_count?: number | null;
          post_count?: number | null;
          engagement_rate?: number | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          account_name?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          follower_count?: number | null;
          connection_count?: number | null;
          post_count?: number | null;
          engagement_rate?: number | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}