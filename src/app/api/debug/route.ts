import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check if voice profile exists
    const { data: voiceProfiles, error: voiceError } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', user.id);
    
    const voiceProfile = voiceProfiles && voiceProfiles.length > 0 ? voiceProfiles[0] : null;

    // Get all tables to verify schema
    const { data: tables, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(0); // Just to test if table exists

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      profile: {
        exists: !!profile && !profileError,
        data: profile,
        error: profileError?.message,
      },
      voiceProfile: {
        exists: !!voiceProfile && !voiceError,
        data: voiceProfile,
        error: voiceError?.message,
      },
      schema: {
        tablesExist: !tableError,
        error: tableError?.message,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error.message
    }, { status: 500 });
  }
}