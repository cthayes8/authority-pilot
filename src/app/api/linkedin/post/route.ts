import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLinkedInAPI } from '@/lib/linkedin/api';
import { z } from 'zod';

const postSchema = z.object({
  contentPostId: z.string().uuid().optional(),
  text: z.string().min(1).max(3000),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS', 'LOGGED_IN_MEMBERS']).default('PUBLIC'),
  scheduledFor: z.string().optional() // ISO string for future scheduling
});

/**
 * POST /api/linkedin/post
 * Publishes content to LinkedIn
 */
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
    const validation = postSchema.safeParse(body);
    
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

    const { contentPostId, text, visibility, scheduledFor } = validation.data;

    // Get user's LinkedIn account
    const { data: linkedinAccount, error: linkedinError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (linkedinError || !linkedinAccount) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn account not connected' },
        { status: 400 }
      );
    }

    // Check if token is still valid
    const tokenExpiry = new Date(linkedinAccount.expires_at);
    if (new Date() >= tokenExpiry) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // If scheduled for future, save to database instead of posting immediately
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      const { data: linkedinPost, error: insertError } = await supabase
        .from('linkedin_posts')
        .insert({
          user_id: user.id,
          content_post_id: contentPostId,
          content: text,
          status: 'scheduled',
          scheduled_for: scheduledFor
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to schedule LinkedIn post:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to schedule post' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Post scheduled successfully',
        postId: linkedinPost.id,
        scheduledFor
      });
    }

    try {
      // Create LinkedIn API instance
      const linkedinAPI = await createLinkedInAPI({
        access_token: linkedinAccount.access_token,
        refresh_token: linkedinAccount.refresh_token,
        expires_in: 0,
        scope: linkedinAccount.scope,
        token_type: 'Bearer',
        expires_at: tokenExpiry
      });

      // Post to LinkedIn
      const linkedinResponse = await linkedinAPI.createPost({
        text,
        visibility
      });

      // Save successful post to database
      const { data: linkedinPost, error: insertError } = await supabase
        .from('linkedin_posts')
        .insert({
          user_id: user.id,
          content_post_id: contentPostId,
          linkedin_post_id: linkedinResponse.id,
          linkedin_activity_id: linkedinResponse.activityUrn,
          content: text,
          status: 'published',
          published_at: new Date().toISOString(),
          linkedin_url: linkedinResponse.shareUrl
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to save LinkedIn post record:', insertError);
        // Post was successful but we couldn't save the record
      }

      // Update content post status if provided
      if (contentPostId) {
        await supabase
          .from('content_posts')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString(),
            platform_data: {
              linkedin: {
                post_id: linkedinResponse.id,
                url: linkedinResponse.shareUrl
              }
            }
          })
          .eq('id', contentPostId)
          .eq('user_id', user.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Post published successfully',
        linkedin: {
          postId: linkedinResponse.id,
          url: linkedinResponse.shareUrl
        },
        postId: linkedinPost?.id
      });

    } catch (linkedinError) {
      console.error('LinkedIn posting error:', linkedinError);
      
      // Save failed post record
      await supabase
        .from('linkedin_posts')
        .insert({
          user_id: user.id,
          content_post_id: contentPostId,
          content: text,
          status: 'failed',
          scheduled_for: scheduledFor
        });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to post to LinkedIn', 
          details: linkedinError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('LinkedIn post API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/linkedin/post
 * Get user's LinkedIn posts
 */
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // published, scheduled, failed

    let query = supabase
      .from('linkedin_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Failed to get LinkedIn posts:', postsError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      posts: posts || []
    });

  } catch (error) {
    console.error('LinkedIn posts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}