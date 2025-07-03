'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResetAccountPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/debug/reset-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.error || 'Failed to reset account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Reset Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Clear your profile and onboarding data for testing
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form className="space-y-6" onSubmit={handleReset}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Your Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset My Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This will clear your profile, voice training, LinkedIn connection, and all content.
              You&apos;ll be able to go through onboarding again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}