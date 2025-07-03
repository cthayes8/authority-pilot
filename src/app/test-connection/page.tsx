'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { openai } from '@/lib/openai';

export default function TestConnectionPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [openaiStatus, setOpenaiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [supabaseMessage, setSupabaseMessage] = useState('');
  const [openaiMessage, setOpenaiMessage] = useState('');
  
  const supabase = createClient();

  const testSupabaseConnection = async () => {
    setSupabaseStatus('testing');
    setSupabaseMessage('Testing connection...');
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        if (error.message.includes('relation "profiles" does not exist')) {
          setSupabaseStatus('error');
          setSupabaseMessage('❌ Database schema not deployed yet. Please run the schema.sql in your Supabase SQL editor.');
          return;
        }
        throw error;
      }
      
      setSupabaseStatus('success');
      setSupabaseMessage('✅ Supabase connection successful! Database schema is deployed.');
    } catch (error: any) {
      setSupabaseStatus('error');
      setSupabaseMessage(`❌ Supabase connection failed: ${error.message}`);
    }
  };

  const testOpenAIConnection = async () => {
    setOpenaiStatus('testing');
    setOpenaiMessage('Testing OpenAI connection...');
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from AuthorityPilot!" and nothing else.'
          }
        ],
        max_tokens: 10,
        temperature: 0,
      });
      
      const content = response.choices[0]?.message?.content;
      if (content && content.includes('Hello from AuthorityPilot')) {
        setOpenaiStatus('success');
        setOpenaiMessage('✅ OpenAI connection successful!');
      } else {
        throw new Error('Unexpected response from OpenAI');
      }
    } catch (error: any) {
      setOpenaiStatus('error');
      setOpenaiMessage(`❌ OpenAI connection failed: ${error.message}`);
    }
  };

  const testAllConnections = async () => {
    await Promise.all([
      testSupabaseConnection(),
      testOpenAIConnection()
    ]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            AuthorityPilot Connection Test
          </h1>
          
          <div className="space-y-6">
            {/* Supabase Test */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Supabase Database
                </h3>
                {getStatusIcon(supabaseStatus)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Tests database connection and schema deployment
              </div>
              {supabaseMessage && (
                <div className="text-sm mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded">
                  {supabaseMessage}
                </div>
              )}
              <Button
                onClick={testSupabaseConnection}
                disabled={supabaseStatus === 'testing'}
                size="sm"
              >
                Test Supabase
              </Button>
            </div>

            {/* OpenAI Test */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  OpenAI API
                </h3>
                {getStatusIcon(openaiStatus)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Tests AI content generation capability
              </div>
              {openaiMessage && (
                <div className="text-sm mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded">
                  {openaiMessage}
                </div>
              )}
              <Button
                onClick={testOpenAIConnection}
                disabled={openaiStatus === 'testing'}
                size="sm"
              >
                Test OpenAI
              </Button>
            </div>

            {/* Test All Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                onClick={testAllConnections}
                disabled={supabaseStatus === 'testing' || openaiStatus === 'testing'}
                className="w-full"
              >
                Test All Connections
              </Button>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Next Steps:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>1. Get your Supabase service role key and update .env</li>
                <li>2. Deploy the database schema (supabase/schema.sql)</li>
                <li>3. Test the connections above</li>
                <li>4. Go to <a href="/" className="underline">the homepage</a> to test the full app</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}