import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Sparkles, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              AuthorityPilot
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/signup">
                Get Started Free
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Become a{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Thought Leader
            </span>
            <br />
            in 10 Minutes a Week
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered personal brand automation that writes in your voice, 
            engages with your audience, and builds your professional authority 
            while you focus on what matters most.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4"
              asChild
            >
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            7-day free trial • No credit card required • Cancel anytime
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mt-16 mb-16">
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Trusted by professionals at leading companies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="h-12 bg-gray-300 rounded-lg"></div>
            <div className="h-12 bg-gray-300 rounded-lg"></div>
            <div className="h-12 bg-gray-300 rounded-lg"></div>
            <div className="h-12 bg-gray-300 rounded-lg"></div>
          </div>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg">
            <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Authentic Voice Matching
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI learns your unique writing style and creates content 
              that sounds exactly like you wrote it.
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg">
            <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Smart Automation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatically generates, schedules, and engages with your 
              network while maintaining your professional reputation.
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Measurable Results
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track your authority score, engagement rates, and lead 
              generation with actionable insights.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-300 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Train Your Voice
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paste 5 LinkedIn posts you&apos;ve written
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-300 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Connect LinkedIn
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Secure OAuth integration
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-300 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Review & Approve
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Quick approval queue
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 dark:text-orange-300 font-bold text-xl">4</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Watch Growth
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track your authority score
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-12">
            One plan that scales with your success
          </p>

          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border-2 border-blue-500">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Professional
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  $99
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500">7-day free trial</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited LinkedIn posts',
                  'AI voice matching',
                  'Content approval queue',
                  'Smart engagement',
                  'Authority score tracking',
                  'Priority support'
                ].map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Authority?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of professionals who have transformed their 
            personal brands with AI
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 text-center text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">AuthorityPilot</span>
        </div>
        <p>&copy; 2025 AuthorityPilot. All rights reserved.</p>
      </footer>
    </div>
  );
}