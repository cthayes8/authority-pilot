/**
 * LinkedIn API Integration
 * Handles posting, engagement, and data retrieval from LinkedIn
 */

import { linkedInAuth, LinkedInTokens } from './auth';

export interface LinkedInPost {
  id?: string;
  text: string;
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_MEMBERS';
  author: string; // LinkedIn member URN
  publishedAt?: string;
  shareUrl?: string;
}

export interface LinkedInPostResponse {
  id: string; // LinkedIn post URN
  activityUrn?: string; // Activity URN for tracking
  shareUrl?: string;
}

export interface LinkedInEngagement {
  postId: string;
  engagementType: 'LIKE' | 'COMMENT' | 'SHARE';
  content?: string; // For comments
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: string;
  connectionsCount?: number;
  followersCount?: number;
}

export interface LinkedInMetrics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  followerGains: number;
}

export class LinkedInAPI {
  private baseUrl = 'https://api.linkedin.com/v2';
  
  constructor(private accessToken: string) {}

  /**
   * Create a text post on LinkedIn
   */
  async createPost(post: Omit<LinkedInPost, 'author'>): Promise<LinkedInPostResponse> {
    // First get the user's member ID
    const profile = await this.getOwnProfile();
    
    const payload = {
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': post.visibility || 'PUBLIC'
      }
    };

    const response = await this.makeRequest('/ugcPosts', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create LinkedIn post: ${error}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      activityUrn: result.activity,
      shareUrl: `https://www.linkedin.com/feed/update/${result.id.replace('urn:li:ugcPost:', '')}/`
    };
  }

  /**
   * Get own LinkedIn profile
   */
  async getOwnProfile(): Promise<LinkedInProfile> {
    const response = await this.makeRequest('/people/~:(id,firstName,lastName,headline,profilePicture(displayImage~:playableStreams))');
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get LinkedIn profile: ${error}`);
    }

    const profile = await response.json();
    
    return {
      id: profile.id,
      firstName: profile.firstName?.localized?.en_US || '',
      lastName: profile.lastName?.localized?.en_US || '',
      headline: profile.headline?.localized?.en_US,
      profilePicture: this.extractProfilePicture(profile.profilePicture)
    };
  }

  /**
   * Get connection count and follower metrics
   */
  async getNetworkMetrics(): Promise<{ connections: number; followers: number }> {
    try {
      // Get connections count
      const connectionsResponse = await this.makeRequest('/people/~/connections?count=0');
      const connections = connectionsResponse.ok ? 
        (await connectionsResponse.json())._total || 0 : 0;

      // Get followers count (if available)
      const followersResponse = await this.makeRequest('/networkSizes/urn:li:person:~:(size)');
      const followers = followersResponse.ok ? 
        (await followersResponse.json()).firstDegreeSize || 0 : 0;

      return { connections, followers };
    } catch (error) {
      console.warn('Failed to get network metrics:', error);
      return { connections: 0, followers: 0 };
    }
  }

  /**
   * Get post analytics/metrics
   */
  async getPostMetrics(postId: string): Promise<LinkedInMetrics> {
    try {
      // LinkedIn analytics API requires additional permissions
      // For now, return mock data or basic engagement counts
      const response = await this.makeRequest(`/socialActions/${postId}/statistics`);
      
      if (response.ok) {
        const stats = await response.json();
        return {
          impressions: stats.impressionCount || 0,
          clicks: stats.clickCount || 0,
          likes: stats.likeCount || 0,
          comments: stats.commentCount || 0,
          shares: stats.shareCount || 0,
          followerGains: 0 // Not available in basic stats
        };
      }
    } catch (error) {
      console.warn('Failed to get post metrics:', error);
    }

    // Return default metrics if API fails
    return {
      impressions: 0,
      clicks: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followerGains: 0
    };
  }

  /**
   * Like a LinkedIn post
   */
  async likePost(postId: string): Promise<boolean> {
    try {
      const profile = await this.getOwnProfile();
      
      const payload = {
        actor: `urn:li:person:${profile.id}`,
        object: postId
      };

      const response = await this.makeRequest('/socialActions', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to like post:', error);
      return false;
    }
  }

  /**
   * Comment on a LinkedIn post
   */
  async commentOnPost(postId: string, commentText: string): Promise<boolean> {
    try {
      const profile = await this.getOwnProfile();
      
      const payload = {
        actor: `urn:li:person:${profile.id}`,
        object: postId,
        message: {
          text: commentText
        }
      };

      const response = await this.makeRequest('/socialActions', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to comment on post:', error);
      return false;
    }
  }

  /**
   * Search for posts to engage with
   */
  async searchPosts(keywords: string[], limit: number = 10): Promise<any[]> {
    try {
      // This would require LinkedIn's content search API
      // For now, return empty array as search requires special permissions
      console.warn('LinkedIn post search not implemented - requires additional API permissions');
      return [];
    } catch (error) {
      console.error('Failed to search posts:', error);
      return [];
    }
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(personId: string, message?: string): Promise<boolean> {
    try {
      const profile = await this.getOwnProfile();
      
      const payload = {
        invitee: {
          'com.linkedin.voyager.growth.invitation.InviteeProfile': {
            profileId: personId
          }
        },
        inviter: {
          'com.linkedin.voyager.growth.invitation.InviterProfile': {
            profileId: profile.id
          }
        },
        ...(message && { message })
      };

      const response = await this.makeRequest('/people/~/mailbox', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send connection request:', error);
      return false;
    }
  }

  /**
   * Get recent posts from feed (for engagement opportunities)
   */
  async getFeedPosts(limit: number = 20): Promise<any[]> {
    try {
      // LinkedIn feed API requires additional permissions
      // This is a placeholder for when we get proper API access
      console.warn('LinkedIn feed access not implemented - requires additional API permissions');
      return [];
    } catch (error) {
      console.error('Failed to get feed posts:', error);
      return [];
    }
  }

  /**
   * Make authenticated request to LinkedIn API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        ...options.headers
      }
    });
  }

  /**
   * Extract profile picture URL from LinkedIn response
   */
  private extractProfilePicture(profilePicture?: any): string | undefined {
    if (!profilePicture?.displayImage) return undefined;
    
    try {
      const elements = profilePicture.displayImage['~']?.elements;
      if (elements && elements.length > 0) {
        const image = elements[elements.length - 1];
        return image.identifiers?.[0]?.identifier;
      }
    } catch (error) {
      console.warn('Failed to extract profile picture URL:', error);
    }
    
    return undefined;
  }
}

/**
 * Factory function to create LinkedIn API instance with valid token
 */
export async function createLinkedInAPI(tokens: LinkedInTokens): Promise<LinkedInAPI> {
  const validToken = await linkedInAuth.getValidAccessToken(tokens);
  return new LinkedInAPI(validToken);
}