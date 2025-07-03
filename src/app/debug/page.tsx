'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: 'Failed to load debug info' });
    } finally {
      setLoading(false);
    }
  };

  const fixProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('No user found');
        return;
      }

      // Try to create profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || user.email,
          onboarding_completed: false,
        });

      if (error && !error.message.includes('duplicate')) {
        alert(`Error creating profile: ${error.message}`);
      } else {
        alert('Profile created/verified successfully!');
        loadDebugInfo();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deploySchema = async () => {
    if (!confirm('Deploy database schema to Supabase? This will create all required tables.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/deploy-schema', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Schema deployed successfully!\n\nResults:\n${result.results?.join('\n') || 'Schema updated'}\n\n${result.errors ? `Warnings:\n${result.errors.join('\n')}` : ''}`);
        loadDebugInfo();
      } else {
        alert(`❌ Schema deployment failed:\n${result.message}\n\n${result.errors?.join('\n') || ''}`);
      }
    } catch (err: any) {
      alert(`❌ Deployment error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">AuthorityPilot Debug Info</h1>
          
          <div className="space-y-6">
            {/* User Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">User Info</h2>
              <pre className="bg-gray-100 dark:bg-slate-700 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(debugInfo?.user, null, 2)}
              </pre>
            </div>

            {/* Profile Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Profile Status</h2>
              <div className="mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  debugInfo?.profile?.exists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo?.profile?.exists ? 'Profile Exists' : 'Profile Missing'}
                </span>
              </div>
              {debugInfo?.profile?.error && (
                <div className="text-red-600 text-sm mb-2">
                  Error: {debugInfo.profile.error}
                </div>
              )}
              <pre className="bg-gray-100 dark:bg-slate-700 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(debugInfo?.profile?.data, null, 2)}
              </pre>
            </div>

            {/* Voice Profile Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Voice Profile Status</h2>
              <div className="mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  debugInfo?.voiceProfile?.exists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {debugInfo?.voiceProfile?.exists ? 'Voice Profile Exists' : 'Voice Profile Not Created'}
                </span>
              </div>
              {debugInfo?.voiceProfile?.error && debugInfo?.voiceProfile?.error !== 'PGRST116' && (
                <div className="text-red-600 text-sm mb-2">
                  Error: {debugInfo.voiceProfile.error}
                </div>
              )}
            </div>

            {/* Schema Status */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Database Schema</h2>
              <div className="mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  debugInfo?.schema?.tablesExist 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo?.schema?.tablesExist ? 'Tables Exist' : 'Tables Missing'}
                </span>
              </div>
              {debugInfo?.schema?.error && (
                <div className="text-red-600 text-sm">
                  Error: {debugInfo.schema.error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t space-x-4">
              <Button onClick={loadDebugInfo} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              {!debugInfo?.schema?.tablesExist && (
                <Button 
                  onClick={deploySchema}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🚀 Deploy Schema
                </Button>
              )}
              
              {!debugInfo?.profile?.exists && debugInfo?.schema?.tablesExist && (
                <Button 
                  onClick={fixProfile}
                  disabled={loading}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  Create Missing Profile
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/onboarding'}
              >
                Go to Onboarding
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}