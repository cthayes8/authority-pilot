'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Heart,
  Check,
  X,
  RefreshCw,
  Edit,
  ChevronRight,
  Zap,
  Target,
  Globe,
  ArrowUp,
  Calendar,
  MessageCircle,
  Eye,
  Award,
  Star,
  Flame
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContentItem {
  id: string;
  title: string;
  type: 'LinkedIn Post' | 'LinkedIn Article' | 'Comment' | 'Connection Message';
  content: string;
  voiceMatch: number;
  expectedPerformance: 'Low' | 'Good' | 'Great' | 'Excellent';
  scheduledFor: string;
  status: 'ready' | 'draft' | 'review';
  aiNotes: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [activeView, setActiveView] = useState<'content' | 'insights' | 'network'>('content');
  const [cardTransition, setCardTransition] = useState('');

  const router = useRouter();
  const supabase = createClient();

  // Premium mock content
  const mockContent: ContentItem[] = [
    {
      id: '1',
      title: 'The Future of AI in Business',
      type: 'LinkedIn Post',
      content: `The AI landscape in 2025 has fundamentally shifted how we approach business strategy. 

What I've learned from working with enterprise clients:

🔥 AI isn't just about automation anymore - it's about augmentation
🚀 The companies thriving are those treating AI as a strategic partner
💡 Success comes from human-AI collaboration, not replacement

Three key insights from my recent project:

1. AI amplifies human creativity rather than replacing it
2. The best results come from clear communication with AI systems  
3. Trust builds through transparency and consistent performance

The question isn't whether AI will transform your industry - it's whether you'll be leading that transformation or watching from the sidelines.

What's your experience with AI in your field? I'd love to hear your perspective.

#AI #BusinessStrategy #Innovation #Leadership`,
      voiceMatch: 94,
      expectedPerformance: 'Excellent',
      scheduledFor: 'Today at 2:30 PM',
      status: 'ready',
      aiNotes: 'Perfect match for your thought leadership style. This post will position you as an AI strategy expert.'
    },
    {
      id: '2',
      title: 'Remote Work Revolution',
      type: 'LinkedIn Post',
      content: `After 3 years of remote work mastery, here's what separates the pros from the amateurs:

❌ What amateurs do:
- Back-to-back video calls all day
- Try to recreate office culture online
- Assume everyone works the same hours

✅ What pros do:
- Async communication by default
- Document everything crystal clear
- Focus on outcomes, not hours

The biggest mindset shift? 

Remote work isn't about working from home - it's about working intentionally.

Your remote work superpower? Drop it below 👇

#RemoteWork #ProductivityHacks #WorkLifeBalance`,
      voiceMatch: 89,
      expectedPerformance: 'Great',
      scheduledFor: 'Tomorrow at 9:00 AM',
      status: 'ready',
      aiNotes: 'This format performs exceptionally well with your audience. High engagement expected.'
    }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) {
      router.push('/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const handleContentAction = async (action: 'approve' | 'skip' | 'edit' | 'regenerate') => {
    const content = mockContent[currentContentIndex];
    if (!content) return;

    // Add smooth transition
    if (action === 'approve') {
      setCardTransition('translate-x-full opacity-0 rotate-12');
    } else if (action === 'skip') {
      setCardTransition('-translate-x-full opacity-0 -rotate-12');
    }

    // Handle the action
    if (action === 'approve') {
      try {
        const response = await fetch('/api/linkedin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content.content, visibility: 'PUBLIC' })
        });
        const result = await response.json();
        if (result.success) {
          console.log('Posted successfully:', result.linkedin?.url);
        }
      } catch (error) {
        console.error('Error posting:', error);
      }
    }
    
    // Move to next content after animation
    setTimeout(() => {
      setCurrentContentIndex((prev) => 
        prev < mockContent.length - 1 ? prev + 1 : 0
      );
      setCardTransition('');
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-indigo-600 animate-pulse" />
            <div className="absolute inset-0 bg-indigo-600/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Preparing your content...</p>
        </div>
      </div>
    );
  }

  const currentContent = mockContent[currentContentIndex];
  const authorityScore = 78;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Premium Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  AuthorityPilot
                </h1>
                <p className="text-xs text-indigo-600 font-medium">AI working 24/7 for you</p>
              </div>
            </div>
            
            {/* Authority Score - Premium Design */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{authorityScore}</div>
                      <div className="text-xs text-indigo-100">Authority</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center text-sm font-semibold text-green-300">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        +5
                      </div>
                      <div className="text-xs text-indigo-100">This week</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="bg-green-500 rounded-full p-1">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Wins Banner */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-lg font-bold">This week's highlight</h2>
                </div>
                <p className="text-green-100 text-sm">Your AI strategy post hit 5,247 views and landed 3 qualified leads!</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">🚀</div>
                <div className="text-sm text-green-100 font-medium">Viral content</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Pills */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-full p-1 border border-white/20 shadow-lg">
            {[
              { key: 'content', label: 'Content', icon: Edit },
              { key: 'insights', label: 'Insights', icon: TrendingUp },
              { key: 'network', label: 'Network', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeView === key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {activeView === 'content' && (
          <div className="max-w-2xl mx-auto">
            {currentContent ? (
              <div className="relative">
                {/* Content Card Stack */}
                <div className="relative h-[600px]">
                  {/* Background cards for stack effect */}
                  <div className="absolute inset-0 bg-white rounded-3xl shadow-lg transform rotate-1 scale-95 opacity-50"></div>
                  <div className="absolute inset-0 bg-white rounded-3xl shadow-lg transform -rotate-1 scale-97 opacity-30"></div>
                  
                  {/* Main content card */}
                  <Card className={`relative bg-white border-0 shadow-2xl rounded-3xl overflow-hidden transform transition-all duration-300 ${cardTransition}`}>
                    <CardContent className="p-0">
                      {/* Card Header */}
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-900">{currentContent.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{currentContent.scheduledFor}</span>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            currentContent.expectedPerformance === 'Excellent' ? 'bg-green-100 text-green-700' :
                            currentContent.expectedPerformance === 'Great' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {currentContent.expectedPerformance === 'Excellent' && '🚀 '}
                            {currentContent.expectedPerformance === 'Great' && '⭐ '}
                            {currentContent.expectedPerformance}
                          </div>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-6">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                          <div className="whitespace-pre-line text-gray-800 leading-relaxed text-sm">
                            {currentContent.content}
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="px-6 pb-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                          <div className="flex items-start space-x-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-2">
                              <Zap className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-indigo-900 mb-1">AI Confidence</h4>
                              <p className="text-sm text-indigo-700 mb-3">{currentContent.aiNotes}</p>
                              <div className="flex items-center space-x-2">
                                <div className="text-xs font-semibold text-indigo-800">
                                  {currentContent.voiceMatch > 90 ? "Sounds exactly like you! 🎯" : 
                                   currentContent.voiceMatch > 80 ? "Pretty close to your style 👍" : 
                                   "AI is still learning your voice 🔧"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-6 pt-0">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <Button 
                            size="lg"
                            className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg rounded-2xl flex flex-col space-y-1"
                            onClick={() => handleContentAction('approve')}
                          >
                            <Check className="h-6 w-6" />
                            <span className="font-semibold">Love it!</span>
                            <span className="text-xs text-green-100">→ or swipe right</span>
                          </Button>
                          <Button 
                            size="lg"
                            variant="outline"
                            className="h-16 border-2 border-gray-200 hover:bg-gray-50 rounded-2xl flex flex-col space-y-1"
                            onClick={() => handleContentAction('skip')}
                          >
                            <X className="h-6 w-6 text-gray-500" />
                            <span className="font-semibold text-gray-700">Skip</span>
                            <span className="text-xs text-gray-500">← or swipe left</span>
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            variant="ghost"
                            className="h-12 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            onClick={() => handleContentAction('edit')}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Quick edit
                          </Button>
                          <Button 
                            variant="ghost"
                            className="h-12 text-purple-600 hover:bg-purple-50 rounded-xl"
                            onClick={() => handleContentAction('regenerate')}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try again
                          </Button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="px-6 pb-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Content {currentContentIndex + 1} of {mockContent.length}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round((1 - (currentContentIndex / mockContent.length)) * 10)} min left
                            </span>
                          </div>
                          <Progress 
                            value={((currentContentIndex + 1) / mockContent.length) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-white border-0 shadow-xl rounded-3xl">
                <CardContent className="text-center py-16">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                    <p className="text-gray-600">Your AI assistant is crafting new content. Check back in 30 minutes.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Authority Growth */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Authority Score</h3>
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {authorityScore}
                    </div>
                    <p className="text-green-600 font-semibold">+5 this week 📈</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Industry Expert</span>
                      <span>{authorityScore}/100</span>
                    </div>
                    <Progress value={authorityScore} className="h-3 bg-white" />
                    <p className="text-sm text-indigo-600 font-medium">22 points to Industry Expert level</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Growth */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="h-6 w-6 text-indigo-600 mr-2" />
                  Network Growth
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-2xl">
                    <div className="text-2xl font-bold text-blue-600">127</div>
                    <p className="text-sm text-blue-700">New connections</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600">8.4K</div>
                    <p className="text-sm text-green-700">Profile views</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-2xl">
                    <div className="text-2xl font-bold text-purple-600">456</div>
                    <p className="text-sm text-purple-700">Post reactions</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-2xl">
                    <div className="text-2xl font-bold text-orange-600">89</div>
                    <p className="text-sm text-orange-700">Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'network' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* High-Value Connections */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target className="h-6 w-6 text-indigo-600 mr-2" />
                  High-Value Connections
                </h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                        J
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">John Peterson</div>
                        <div className="text-sm text-blue-600">CTO at TechFlow • Engaged 3x this week</div>
                        <div className="text-xs text-gray-500 mt-1">Potential warm lead - high intent signals</div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        Connect
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                        S
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Sarah Chen</div>
                        <div className="text-sm text-green-600">VP Marketing at ScaleUp • Mutual connection</div>
                        <div className="text-xs text-gray-500 mt-1">Posted about AI marketing - perfect opportunity</div>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                        Engage
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Opportunities */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <MessageCircle className="h-6 w-6 text-purple-600 mr-2" />
                  Smart Opportunities
                </h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-500 rounded-lg p-2">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-purple-900">5 trending discussions</div>
                        <div className="text-sm text-purple-700 mb-2">AI ethics, remote work, and SaaS growth</div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                          Join conversations
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                    <div className="flex items-start space-x-3">
                      <div className="bg-orange-500 rounded-lg p-2">
                        <Heart className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-orange-900">12 posts to engage with</div>
                        <div className="text-sm text-orange-700 mb-2">AI drafted thoughtful comments ready</div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg">
                          Review comments
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}