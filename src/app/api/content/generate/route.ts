import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VoiceTrainer } from '@/lib/voice-training';
import { z } from 'zod';

const contentGenerationSchema = z.object({
  topic: z.string().optional(),
  contentType: z.enum(['post', 'article', 'thread']).default('post'),
  platform: z.enum(['linkedin', 'twitter']).default('linkedin'),
  customPrompt: z.string().optional(),
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
    const validation = contentGenerationSchema.safeParse(body);
    
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

    const { topic, contentType, platform, customPrompt } = validation.data;

    // Get user's voice profile
    const { data: voiceProfiles, error: voiceError } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', user.id);
    
    const voiceProfile = voiceProfiles && voiceProfiles.length > 0 ? voiceProfiles[0] : null;

    if (voiceError || !voiceProfile) {
      return NextResponse.json(
        { success: false, error: 'Voice profile not found. Please complete voice training first.' },
        { status: 400 }
      );
    }

    // Get user profile for context
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('industry, role, company')
      .eq('id', user.id)
      .single();

    // Generate content prompt
    const prompt = customPrompt || topic || await generateTopicPrompt(userProfile);
    
    // Initialize voice trainer and generate content
    const trainer = new VoiceTrainer();
    const result = await trainer.generateContent(
      prompt,
      voiceProfile,
      contentType,
      platform
    );

    // Save generated content to database
    const { data: contentPost, error: saveError } = await supabase
      .from('content_posts')
      .insert({
        user_id: user.id,
        content_type: contentType,
        platform,
        content: {
          text: result.content,
          hashtags: extractHashtags(result.content),
          mentions: extractMentions(result.content),
        },
        ai_generated: true,
        ai_confidence_score: result.confidence,
        generation_prompt: prompt,
        voice_profile_version: voiceProfile.training_version,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Content save error:', saveError);
      return NextResponse.json(
        { success: false, error: 'Failed to save generated content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        confidence: result.confidence,
        contentId: contentPost.id,
        platform,
        contentType
      }
    });
  } catch (error) {
    console.error('Content generation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Generate a topic prompt based on user's industry and role
async function generateTopicPrompt(userProfile: any): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const topics = [
    `Share an insight about ${userProfile?.industry || 'your industry'} trends in 2025`,
    `Discuss a lesson learned from your experience as a ${userProfile?.role || 'professional'}`,
    `Share your perspective on the future of ${userProfile?.industry || 'your field'} by 2026`,
    `Offer advice to someone starting their career in ${userProfile?.industry || 'your industry'}`,
    `Reflect on the biggest changes in ${userProfile?.industry || 'your field'} this year (2025)`,
    `Share a recent win or achievement you're proud of`,
    `Discuss a challenge many ${userProfile?.role || 'professionals'} face and how to overcome it`,
    `Share your thoughts on work-life balance in the current market`,
    `Discuss the importance of continuous learning in ${userProfile?.industry || 'your field'}`,
    `Share what you're excited about in your industry for the rest of 2025`,
  ];
  
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  return `${randomTopic}. Make it personal and authentic, written on ${currentDate}.`;
}

// Extract hashtags from content
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

// Extract mentions from content
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(mention => mention.toLowerCase()) : [];
}