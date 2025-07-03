import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { linkedInAuth } from '@/lib/linkedin/auth';
import { nanoid } from 'nanoid';

/**
 * GET /api/auth/linkedin
 * Initiates LinkedIn OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state parameter for security
    const state = nanoid();
    
    // Store state in database temporarily (expires in 10 minutes)
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        provider: 'linkedin',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError);
      return NextResponse.json(
        { success: false, error: 'Failed to initiate OAuth flow' },
        { status: 500 }
      );
    }

    // Generate LinkedIn authorization URL
    const authUrl = linkedInAuth.getAuthorizationUrl(state);

    return NextResponse.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}