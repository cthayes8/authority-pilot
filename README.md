# AuthorityPilot

> AI-powered personal brand automation that transforms busy professionals into thought leaders in just 10 minutes a week.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key
- LinkedIn Developer Account (for OAuth)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # LinkedIn OAuth (for Phase 2)
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   ```

3. **Set up Supabase database:**
   ```bash
   # Run the schema SQL in your Supabase SQL editor
   cat supabase/schema.sql
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Features

### ✅ Phase 1 - Core Value Loop (MVP)
- [x] Landing page with value proposition
- [x] User authentication (Supabase Auth)
- [x] 4-step onboarding flow
- [x] Voice training from writing samples
- [x] AI content generation (GPT-4)
- [x] Content approval queue with Tinder-style UI
- [x] Dashboard with authority score

### 🚧 Phase 2 - Automation (In Progress)
- [ ] LinkedIn OAuth integration
- [ ] Auto-posting to LinkedIn
- [ ] Basic engagement features
- [ ] Simple analytics
- [ ] Stripe payment integration

### 📅 Phase 3 - Intelligence (Planned)
- [ ] Content performance tracking
- [ ] Enhanced voice matching
- [ ] Smart engagement automation
- [ ] Multi-platform support

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── content/       # Content generation
│   │   └── voice/         # Voice training
│   ├── dashboard/         # Main dashboard
│   ├── onboarding/        # 4-step onboarding
│   ├── login/            # Authentication
│   └── signup/           
├── components/ui/         # UI components (shadcn/ui style)
├── lib/                  # Core libraries
│   ├── supabase/         # Supabase client/server
│   ├── types.ts          # TypeScript definitions
│   ├── voice-training.ts # AI voice analysis
│   └── openai.ts         # OpenAI integration
└── supabase/
    └── schema.sql        # Database schema
```

## 💡 Key Design Decisions

### Simplicity First
- **Single pricing tier** ($99/month) for MVP
- **LinkedIn-only** initially (Twitter in Phase 2)
- **No complex architecture** - focus on core value delivery
- **MVP database schema** - only essential tables

### Voice Matching Technology
- GPT-4 analyzes writing samples to extract voice characteristics
- Generates content that matches user's tone, vocabulary, and style
- Confidence scoring for generated content
- 2025 temporal awareness built into all AI interactions

### User Experience
- **Sub-5-minute onboarding** (critical requirement)
- **Sub-2-minute time to first content** generation
- **Tinder-style approval** interface for content review
- **Authority Score** gamification element

## 🗄️ Database Schema

### Core Tables (Phase 1)
- `profiles` - User profile data
- `voice_profiles` - AI voice training data
- `content_posts` - Generated content queue
- `linkedin_accounts` - OAuth tokens (Phase 2)

### Key Features
- **Row Level Security** enabled on all tables
- **Automatic profile creation** on user signup
- **Authority score calculation** function
- **Temporal awareness** in all AI interactions

## 🎯 Success Metrics

### Technical Goals
- Onboarding completion rate >80%
- Time to first content <2 minutes
- Voice match satisfaction >85%
- System uptime >99.5%

### Business Goals
- Free trial to paid conversion >15%
- Monthly churn rate <5%
- 100 paying users at $99/month (initial goal)

## 🔐 Security

- All social media tokens encrypted at application level
- Row Level Security (RLS) on all database tables
- Rate limiting on API endpoints
- Input validation with Zod schemas
- No sensitive data in logs

## 📱 Current Status

**Phase 1 (Week 1) - 90% Complete:**
- ✅ Landing page and auth system
- ✅ Onboarding flow with voice training
- ✅ AI content generation engine
- ✅ Dashboard with approval queue
- ⏳ Final testing and polish

**Ready for testing:** Core value proposition is functional end-to-end.

## 🚀 Next Steps

1. **Complete Phase 1** - Final testing and bug fixes
2. **LinkedIn OAuth** - Implement auto-posting
3. **Stripe Integration** - Payment processing
4. **Beta Testing** - Recruit 10-20 beta users
5. **Public Launch** - Product Hunt and marketing campaign

## 📞 Support

For questions or issues:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Documentation](https://docs.authoritypilot.com)

---

**AuthorityPilot** - Transforming professionals into thought leaders, one post at a time. 🚀