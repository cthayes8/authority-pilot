# AuthorityPilot Deployment Guide

## 🚨 Critical Setup Steps

### Step 1: Get Your Supabase Service Role Key

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `atuzcghgcsqpaobykzeq`
3. **Navigate to**: Settings → API
4. **Copy the `service_role` key** (NOT the anon key)
5. **Update your .env file**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_service_role_key_here...
   ```

### Step 2: Deploy Database Schema

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/atuzcghgcsqpaobykzeq/sql
2. **Copy the entire contents** of `supabase/schema.sql`
3. **Paste and run** the SQL in the editor
4. **Verify tables are created**:
   - profiles
   - voice_profiles  
   - content_posts
   - linkedin_accounts

### Step 3: Test Your Setup

1. **Visit**: http://localhost:3001/test-connection
2. **Click "Test All Connections"**
3. **Verify both are green** ✅

### Step 4: Test Full User Flow

1. **Go to**: http://localhost:3001
2. **Click "Get Started Free"**
3. **Complete signup and onboarding**
4. **Test voice training and content generation**

---

## 🔧 Troubleshooting

### Supabase Connection Issues

**Problem**: "relation 'profiles' does not exist"
- **Solution**: Run the schema.sql in Supabase SQL editor

**Problem**: "Invalid API key"  
- **Solution**: Double-check the service role key in .env

**Problem**: "Row Level Security policy violation"
- **Solution**: Schema includes RLS policies, should work automatically

### OpenAI Connection Issues

**Problem**: "Invalid API key"
- **Solution**: Verify your OpenAI API key in .env

**Problem**: "Rate limit exceeded"
- **Solution**: You may need to add billing info to your OpenAI account

---

## 🎯 What Should Work After Setup

✅ **User signup/login**
✅ **Onboarding flow (4 steps)**
✅ **Voice training from writing samples**
✅ **AI content generation**
✅ **Content approval queue**
✅ **Dashboard with authority score**

---

## 🚀 Ready for Production

Once everything works locally:

1. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

2. **Add environment variables** in Vercel dashboard

3. **Update CORS settings** in Supabase for your domain

4. **Test production deployment**

---

## 📞 Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database schema is fully deployed
4. Test connections at `/test-connection`