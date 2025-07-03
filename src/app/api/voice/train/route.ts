import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VoiceTrainer } from '@/lib/voice-training';
import { z } from 'zod';

const trainingSchema = z.object({
  writingSamples: z.array(z.string().min(10)).min(3).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = trainingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { writingSamples } = validation.data;

    // Initialize voice trainer
    const trainer = new VoiceTrainer();
    
    // Analyze writing samples
    const voiceAnalysis = await trainer.analyzeWritingSamples(writingSamples);

    // Check if voice profile already exists
    const { data: existingProfile } = await supabase
      .from('voice_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const voiceProfileData = {
      user_id: user.id,
      writing_samples: writingSamples,
      tone_attributes: voiceAnalysis.toneAttributes,
      vocabulary_preferences: voiceAnalysis.vocabularyPreferences,
      sentence_structure: voiceAnalysis.sentenceStructure,
      emoji_usage: voiceAnalysis.emojiUsage,
      hashtag_style: voiceAnalysis.hashtagStyle,
      key_messages: voiceAnalysis.keyMessages || [],
      brand_personality: voiceAnalysis.brandPersonality,
      last_trained_at: new Date().toISOString(),
      training_version: voiceAnalysis.trainingVersion || 1,
    };

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('voice_profiles')
        .update(voiceProfileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Voice profile update error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update voice profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          voiceProfile: data,
          message: 'Voice profile updated successfully'
        }
      });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('voice_profiles')
        .insert(voiceProfileData)
        .select()
        .single();

      if (error) {
        console.error('Voice profile creation error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create voice profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          voiceProfile: data,
          message: 'Voice profile created successfully'
        }
      });
    }
  } catch (error) {
    console.error('Voice training API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's voice profile
    const { data: voiceProfile, error } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No voice profile found
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No voice profile found'
        });
      }
      
      console.error('Voice profile fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch voice profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voiceProfile
    });
  } catch (error) {
    console.error('Voice profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}