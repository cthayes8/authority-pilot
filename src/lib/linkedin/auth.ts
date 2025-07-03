/**
 * LinkedIn OAuth 2.0 Integration
 * Handles authentication and token management for LinkedIn API access
 */

export interface LinkedInTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expires_at: Date;
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture?: string;
  vanityName?: string;
  industry?: string;
}

export class LinkedInAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseAuthUrl = 'https://www.linkedin.com/oauth/v2/authorization';
  private tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  private profileUrl = 'https://api.linkedin.com/v2/people/~';

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('LinkedIn OAuth credentials not configured');
    }
  }

  /**
   * Generate LinkedIn OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'openid',
      'profile', 
      'email',
      'w_member_social',  // Post to LinkedIn
      'r_basicprofile',   // Read basic profile
      'r_1st_connections_size', // Connection count
      'r_member_social'   // Read posts and activity
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      ...(state && { state })
    });

    return `${this.baseAuthUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<LinkedInTokens> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn token exchange failed: ${error}`);
    }

    const tokens = await response.json();
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000))
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<LinkedInTokens> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn token refresh failed: ${error}`);
    }

    const tokens = await response.json();
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken, // Keep existing if not provided
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000))
    };
  }

  /**
   * Get LinkedIn profile information
   */
  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch(`${this.profileUrl}?projection=(id,firstName,lastName,headline,profilePicture(displayImage~:playableStreams),vanityName,industryName)`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn profile fetch failed: ${error}`);
    }

    const profile = await response.json();
    
    return {
      id: profile.id,
      firstName: profile.firstName?.localized?.en_US || '',
      lastName: profile.lastName?.localized?.en_US || '',
      headline: profile.headline?.localized?.en_US || '',
      profilePicture: this.extractProfilePicture(profile.profilePicture),
      vanityName: profile.vanityName,
      industry: profile.industryName?.localized?.en_US
    };
  }

  /**
   * Check if access token is still valid
   */
  isTokenValid(tokens: LinkedInTokens): boolean {
    return new Date() < tokens.expires_at;
  }

  /**
   * Check if tokens need refresh (within 5 minutes of expiry)
   */
  needsRefresh(tokens: LinkedInTokens): boolean {
    const fiveMinutesFromNow = new Date(Date.now() + (5 * 60 * 1000));
    return fiveMinutesFromNow >= tokens.expires_at;
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(tokens: LinkedInTokens): Promise<string> {
    if (this.isTokenValid(tokens) && !this.needsRefresh(tokens)) {
      return tokens.access_token;
    }

    if (tokens.refresh_token) {
      const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
      // Note: In a real implementation, you'd save the refreshed tokens to database
      return refreshedTokens.access_token;
    }

    throw new Error('Access token expired and no refresh token available');
  }

  /**
   * Revoke LinkedIn access tokens
   */
  async revokeTokens(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      token: accessToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn token revocation failed: ${error}`);
    }
  }

  /**
   * Extract profile picture URL from LinkedIn response
   */
  private extractProfilePicture(profilePicture?: any): string | undefined {
    if (!profilePicture?.displayImage) return undefined;
    
    try {
      const elements = profilePicture.displayImage['~']?.elements;
      if (elements && elements.length > 0) {
        // Get the largest available image
        const image = elements[elements.length - 1];
        return image.identifiers?.[0]?.identifier;
      }
    } catch (error) {
      console.warn('Failed to extract profile picture URL:', error);
    }
    
    return undefined;
  }
}

// Export singleton instance
export const linkedInAuth = new LinkedInAuth();