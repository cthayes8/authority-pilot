import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { linkedInAuth } from '@/lib/linkedin/auth';

/**
 * GET /api/auth/linkedin/callback
 * Handles LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=linkedin_oauth_failed&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=missing_parameters`
      );
    }

    // Verify state parameter
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('user_id, expires_at')
      .eq('state', state)
      .eq('provider', 'linkedin')
      .single();

    if (stateError || !oauthState) {
      console.error('Invalid OAuth state:', stateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=invalid_state`
      );
    }

    // Check if state has expired
    if (new Date() > new Date(oauthState.expires_at)) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=expired_state`
      );
    }

    // Clean up used state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    try {
      // Exchange code for tokens
      const tokens = await linkedInAuth.exchangeCodeForTokens(code);
      
      // Get LinkedIn profile
      const profile = await linkedInAuth.getProfile(tokens.access_token);

      // Store LinkedIn connection in database
      const { error: insertError } = await supabase
        .from('linkedin_accounts')
        .upsert({
          user_id: oauthState.user_id,
          account_id: profile.id, // Use account_id instead of linkedin_id
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at.toISOString(),
          scope: tokens.scope,
          profile_data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            headline: profile.headline,
            profilePicture: profile.profilePicture,
            vanityName: profile.vanityName,
            industry: profile.industry
          },
          connected_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id'
        });

      if (insertError) {
        console.error('Failed to store LinkedIn connection:', insertError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=storage_failed`
        );
      }

      // Update user profile to mark LinkedIn as connected
      await supabase
        .from('profiles')
        .update({ linkedin_connected: true })
        .eq('id', oauthState.user_id);

      // Success - redirect to onboarding completion
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=4&linkedin=connected`
      );

    } catch (tokenError) {
      console.error('LinkedIn token exchange failed:', tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=token_exchange_failed&message=${encodeURIComponent(tokenError.message)}`
      );
    }

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=callback_failed`
    );
  }
}