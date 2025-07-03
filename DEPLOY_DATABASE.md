# 🚀 Deploy Database Schema to Supabase

## Quick Deploy Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**: 
   https://supabase.com/dashboard/project/atuzcghgcsqpaobykzeq/sql

2. **Copy the entire schema** from `supabase/schema.sql`

3. **Paste and run** in the SQL editor

4. **Verify deployment** - You should see:
   - ✅ 4 tables created (profiles, voice_profiles, content_posts, linkedin_accounts)
   - ✅ RLS policies applied
   - ✅ Triggers and functions created

### Option 2: Via Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref atuzcghgcsqpaobykzeq

# Deploy schema
supabase db push
```

## Test Your Setup

### 1. Visit the Test Page
http://localhost:3000/test-connection

### 2. Click "Test All Connections"

You should see:
- ✅ Supabase connection successful! Database schema is deployed.
- ✅ OpenAI connection successful!

### 3. Test the Full App
http://localhost:3000

## Common Issues & Solutions

### "relation 'profiles' does not exist"
- **Cause**: Schema not deployed yet
- **Fix**: Run the schema.sql in Supabase SQL editor

### "Invalid API key"
- **Cause**: Wrong API key or not loaded
- **Fix**: Restart the dev server after updating .env

### "permission denied for table profiles"
- **Cause**: RLS policies not applied
- **Fix**: Re-run the schema.sql file

## What Happens During Schema Deployment

1. **Tables Created**:
   - `profiles` - User profile data
   - `voice_profiles` - AI voice training data
   - `content_posts` - Generated content
   - `linkedin_accounts` - OAuth tokens

2. **Security Applied**:
   - Row Level Security (RLS) enabled
   - Users can only access their own data
   - Service role key bypasses RLS for admin operations

3. **Automations Set Up**:
   - Auto-create profile on user signup
   - Updated_at timestamp triggers
   - Authority score calculation function

## Next Steps

Once deployment is successful:
1. Create your first account
2. Complete onboarding
3. Test voice training (both paths!)
4. Generate your first content

---

**Need help?** Check the browser console for detailed error messages.