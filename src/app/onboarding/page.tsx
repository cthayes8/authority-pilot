'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, User, FileText, Link as LinkIcon, Zap, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OnboardingData } from '@/lib/types';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step: 1,
    profile: {
      fullName: '',
      role: '',
      company: '',
      industry: '',
    },
    writingSamples: [],
    linkedinConnected: false,
  });

  const router = useRouter();
  const supabase = createClient();
  
  const totalSteps = 4;
  const stepTimes = [3, 7, 2, 3]; // minutes per step
  const stepTitles = [
    "Tell us about you",
    "Train your AI voice", 
    "Connect LinkedIn",
    "Review your first week"
  ];

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      if (profile) {
        setOnboardingData(prev => ({
          ...prev,
          profile: {
            fullName: profile.full_name || '',
            role: profile.role || '',
            company: profile.company || '',
            industry: profile.industry || '',
          }
        }));
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: onboardingData.profile.fullName,
            role: onboardingData.profile.role,
            company: onboardingData.profile.company,
            industry: onboardingData.profile.industry,
            expertise_areas: onboardingData.profile.expertise,
            target_audience: onboardingData.profile.targetAudience,
            onboarding_completed: true,
          });

        if (createError) {
          console.error('Profile creation error:', createError);
          throw new Error(`Failed to create profile: ${createError.message}`);
        }
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: onboardingData.profile.fullName,
            role: onboardingData.profile.role,
            company: onboardingData.profile.company,
            industry: onboardingData.profile.industry,
            expertise_areas: onboardingData.profile.expertise,
            target_audience: onboardingData.profile.targetAudience,
            onboarding_completed: true,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
      }

      // Create voice profile if writing samples provided
      if (onboardingData.writingSamples && onboardingData.writingSamples.length > 0) {
        // First check if voice profile already exists
        const { data: existingVoice } = await supabase
          .from('voice_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingVoice) {
          // Update existing voice profile
          const { error: voiceUpdateError } = await supabase
            .from('voice_profiles')
            .update({
              writing_samples: onboardingData.writingSamples,
            })
            .eq('user_id', user.id);

          if (voiceUpdateError) {
            console.error('Voice profile update error:', voiceUpdateError);
            throw new Error(`Failed to update voice profile: ${voiceUpdateError.message}`);
          }
        } else {
          // Create new voice profile
          const { error: voiceCreateError } = await supabase
            .from('voice_profiles')
            .insert({
              user_id: user.id,
              writing_samples: onboardingData.writingSamples,
            });

          if (voiceCreateError) {
            console.error('Voice profile creation error:', voiceCreateError);
            throw new Error(`Failed to create voice profile: ${voiceCreateError.message}`);
          }
        }
      }

      // Small delay to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      console.error('Detailed onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep data={onboardingData} setData={setOnboardingData} />;
      case 2:
        return <VoiceTrainingStep data={onboardingData} setData={setOnboardingData} />;
      case 3:
        return <LinkedInConnectStep data={onboardingData} setData={setOnboardingData} />;
      case 4:
        return <ContentPreviewStep data={onboardingData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.profile.fullName && onboardingData.profile.role && onboardingData.profile.industry && onboardingData.profile.expertise && onboardingData.profile.targetAudience;
      case 2:
        return onboardingData.writingSamples && onboardingData.writingSamples.length >= 1; // Allow quiz path
      case 3:
        return true; // LinkedIn connection is optional for MVP
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Progress Bar */}
      <div className="w-full bg-white dark:bg-slate-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">AuthorityPilot</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {stepTitles[currentStep - 1]}
              </div>
              <div className="text-xs text-gray-500">
                Step {currentStep} of {totalSteps} • {stepTimes[currentStep - 1]} min
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Initial Setup</span>
            <span>15 minutes total</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center"
            >
              {loading ? (
                'Processing...'
              ) : currentStep === totalSteps ? (
                <>
                  Complete Setup
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Information
function BasicInfoStep({ data, setData }: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}) {

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tell us about yourself
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Just like "I'm Sarah, a Marketing Director in SaaS who wants to be known for growth strategies"
        </p>
        <div className="text-sm text-blue-600 font-medium mt-2">
          ⏱️ 3 minutes
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={data.profile.fullName}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, fullName: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Role *
          </label>
          <input
            type="text"
            value={data.profile.role}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, role: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Marketing Director"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={data.profile.company}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, company: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="TechFlow SaaS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry *
          </label>
          <input
            type="text"
            value={data.profile.industry}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, industry: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="SaaS"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            💡 Be specific! This helps us create content that resonates with your exact audience and industry terminology.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What do you want to be known for? *
          </label>
          <input
            type="text"
            value={data.profile.expertise || ''}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, expertise: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Growth strategies"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            🎯 Your area of expertise or what you want to become known for
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Who is your target audience? *
          </label>
          <input
            type="text"
            value={data.profile.targetAudience || ''}
            onChange={(e) => setData({
              ...data,
              profile: { ...data.profile, targetAudience: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="B2B founders"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            👥 Who do you want to reach with your content?
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 2: Voice Training
function VoiceTrainingStep({ data, setData }: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}) {
  const [selectedPath, setSelectedPath] = useState<'existing' | 'quiz' | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [detectedPosts, setDetectedPosts] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Smart post detection from pasted content
  const detectPosts = (content: string) => {
    // Split content by common post separators
    const posts = content
      .split(/\n\s*\n\s*---\s*\n\s*\n|\n\s*\n\s*\*\*\*\s*\n\s*\n|\n{3,}/)
      .map(post => post.trim())
      .filter(post => post.length > 50); // Minimum post length
    
    setDetectedPosts(posts);
    setData({
      ...data,
      writingSamples: posts
    });
  };

  const handleQuizAnswer = (question: string, answer: string) => {
    const newAnswers = { ...quizAnswers, [question]: answer };
    setQuizAnswers(newAnswers);
    
    // Convert quiz answers to voice profile data
    if (Object.keys(newAnswers).length >= 5) {
      setData({
        ...data,
        writingSamples: [`Generated from personality quiz: ${JSON.stringify(newAnswers)}`]
      });
    }
  };

  if (!selectedPath) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Train your AI voice
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI learns your style instantly • See side-by-side: "Does this sound like you?"
          </p>
          <div className="text-sm text-blue-600 font-medium mt-2">
            ⏱️ 7 minutes
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Path 1: Existing Content */}
          <div 
            onClick={() => setSelectedPath('existing')}
            className="border-2 border-gray-200 dark:border-slate-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <div className="text-center">
              <FileText className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                I have existing content
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Paste 5-10 of your best LinkedIn posts
              </p>
              <div className="text-xs text-blue-600 font-medium">
                ✨ Most accurate voice matching
              </div>
            </div>
          </div>

          {/* Path 2: Personality Quiz */}
          <div 
            onClick={() => setSelectedPath('quiz')}
            className="border-2 border-gray-200 dark:border-slate-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          >
            <div className="text-center">
              <User className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                I&apos;m new to content creation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Write 3 sample posts on given topics
              </p>
              <div className="text-xs text-purple-600 font-medium">
                🎯 Perfect for beginners
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Don&apos;t worry:</strong> You can always refine your voice later as you use the platform
          </p>
        </div>
      </div>
    );
  }

  if (selectedPath === 'existing') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedPath(null)}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paste your content
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add 3-5 pieces of content you&apos;ve written
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Content *
            </label>
            <textarea
              value={pastedContent}
              onChange={(e) => {
                setPastedContent(e.target.value);
                if (e.target.value.trim()) {
                  detectPosts(e.target.value);
                }
              }}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Paste your LinkedIn posts, blog articles, or other content here...

Separate different posts with:
---

Like this. Each post should be at least a few sentences long."
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{pastedContent.length} characters</span>
              <span>{detectedPosts.length} posts detected</span>
            </div>
          </div>

          {detectedPosts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Detected Posts ({detectedPosts.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {detectedPosts.map((post, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Post {index + 1}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {post.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tips for better results:</strong>
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 list-disc list-inside">
              <li>Include posts that show different sides of your personality</li>
              <li>Mix professional insights with personal experiences</li>
              <li>Include both shorter and longer posts if possible</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPath === 'quiz') {
    const questions = [
      {
        id: 'tone',
        question: 'How would you describe your professional communication style?',
        options: [
          { value: 'formal', label: 'Formal and traditional' },
          { value: 'conversational', label: 'Conversational and approachable' },
          { value: 'authoritative', label: 'Authoritative and confident' },
          { value: 'friendly', label: 'Friendly and personable' }
        ]
      },
      {
        id: 'humor',
        question: 'How often do you use humor in professional settings?',
        options: [
          { value: 'never', label: 'Rarely or never' },
          { value: 'subtle', label: 'Subtle humor occasionally' },
          { value: 'moderate', label: 'Light humor regularly' },
          { value: 'frequent', label: 'Humor is part of my personality' }
        ]
      },
      {
        id: 'length',
        question: 'What length of content do you prefer?',
        options: [
          { value: 'short', label: 'Short and punchy (1-2 sentences)' },
          { value: 'medium', label: 'Medium length (1-2 paragraphs)' },
          { value: 'long', label: 'Detailed explanations (3+ paragraphs)' },
          { value: 'mixed', label: 'Mix of short and long content' }
        ]
      },
      {
        id: 'stories',
        question: 'How do you prefer to share insights?',
        options: [
          { value: 'facts', label: 'Direct facts and data' },
          { value: 'examples', label: 'Real examples and case studies' },
          { value: 'stories', label: 'Personal stories and experiences' },
          { value: 'questions', label: 'Thought-provoking questions' }
        ]
      },
      {
        id: 'expertise',
        question: 'How do you position your expertise?',
        options: [
          { value: 'humble', label: 'Humble and learning-focused' },
          { value: 'confident', label: 'Confident thought leader' },
          { value: 'collaborative', label: 'Collaborative team player' },
          { value: 'innovative', label: 'Innovative problem solver' }
        ]
      }
    ];

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedPath(null)}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Define your voice
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Answer a few questions to create your unique writing style
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {index + 1}. {q.question}
              </label>
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name={q.id}
                      value={option.value}
                      checked={quizAnswers[q.id] === option.value}
                      onChange={() => handleQuizAnswer(q.id, option.value)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              🎯 <strong>Based on your answers:</strong> We&apos;ll create a voice profile that matches your communication style and generate sample content for you to review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Step 3: LinkedIn Connection
function LinkedInConnectStep({ data, setData }: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  useEffect(() => {
    // Check for connection status from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinStatus = urlParams.get('linkedin');
    const error = urlParams.get('error');
    const message = urlParams.get('message');

    if (linkedinStatus === 'connected') {
      setConnectionSuccess(true);
      setData({ ...data, linkedinConnected: true });
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    } else if (error) {
      setConnectionError(message ? decodeURIComponent(message) : 'LinkedIn connection failed');
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [data, setData]);

  const handleLinkedInConnect = async () => {
    setConnecting(true);
    setConnectionError('');

    try {
      // Call our LinkedIn OAuth initiation endpoint
      const response = await fetch('/api/auth/linkedin');
      const result = await response.json();

      if (result.success) {
        // Redirect to LinkedIn OAuth
        window.location.href = result.authUrl;
      } else {
        setConnectionError(result.error || 'Failed to initiate LinkedIn connection');
      }
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      setConnectionError('Failed to connect to LinkedIn. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <LinkIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Connect LinkedIn
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          One-click OAuth connection • Choose posting frequency (3-5x per week) • Set preferred posting times
        </p>
        <div className="text-sm text-blue-600 font-medium mt-2">
          ⏱️ 2 minutes
        </div>
      </div>

      {connectionError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {connectionError}
        </div>
      )}

      <div className="text-center">
        {connectionSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              ✅ LinkedIn connected successfully!
            </div>
            <p className="text-sm text-gray-600">
              Your LinkedIn account is now connected and ready for automatic posting.
            </p>
          </div>
        ) : (
          <>
            <Button 
              size="lg"
              className="mb-4"
              onClick={handleLinkedInConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect LinkedIn Account
                </>
              )}
            </Button>
            
            <p className="text-sm text-gray-500 mb-6">
              Or skip this step and connect later in settings
            </p>
          </>
        )}

        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Your LinkedIn credentials are encrypted and secure. 
            We only post content that you explicitly approve.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 4: Content Preview
function ContentPreviewStep({ data }: { data: OnboardingData }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review your first week
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          AI generates your first 5 posts • Swipe right to approve, left to regenerate • Hit "Schedule All" - you're done!
        </p>
        <div className="text-sm text-blue-600 font-medium mt-2">
          ⏱️ 3 minutes
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="font-semibold mb-2">✨ Your first 5 posts are ready:</h3>
          <ul className="space-y-2 text-sm">
            <li>• Monday: Industry insight about {data.profile.industry}</li>
            <li>• Tuesday: Your expertise in {data.profile.expertise || 'your field'}</li>
            <li>• Wednesday: Engaging question for {data.profile.targetAudience || 'your audience'}</li>
            <li>• Thursday: Personal story from your experience</li>
            <li>• Friday: Week wrap-up and insights</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Free Trial</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600">∞</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Content Ideas</div>
          </div>
        </div>
      </div>
    </div>
  );
}