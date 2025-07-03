import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user by email using listUsers and filtering
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Reset user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        professional_background: null,
        expertise_areas: null,
        target_audience: null,
        posting_frequency: null,
        preferred_times: null,
        linkedin_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile reset error:', profileError);
    }

    // Clear voice training data
    const { error: voiceError } = await supabase
      .from('voice_training')
      .delete()
      .eq('user_id', userId);

    if (voiceError) {
      console.error('Voice training reset error:', voiceError);
    }

    // Clear LinkedIn connection
    const { error: linkedinError } = await supabase
      .from('linkedin_accounts')
      .delete()
      .eq('user_id', userId);

    if (linkedinError) {
      console.error('LinkedIn reset error:', linkedinError);
    }

    // Clear content posts
    const { error: contentError } = await supabase
      .from('content_posts')
      .delete()
      .eq('user_id', userId);

    if (contentError) {
      console.error('Content reset error:', contentError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account reset successfully. User can now go through onboarding again.' 
    });

  } catch (error) {
    console.error('Reset account error:', error);
    return NextResponse.json(
      { error: 'Failed to reset account' }, 
      { status: 500 }
    );
  }
}