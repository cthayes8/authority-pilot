import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        details: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Read schema file
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        error: 'Schema file not found',
        path: schemaPath
      }, { status: 404 });
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const results = [];
    let errors = [];
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Use raw SQL execution
          const { data, error } = await supabase
            .from('_realtime_schema')
            .select('*')
            .limit(0); // This will fail, but we use it to get a connection
          
          // Try a different approach - use the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement + ';' })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            if (!errorText.includes('already exists') && !errorText.includes('duplicate')) {
              errors.push(`Statement failed: ${statement.substring(0, 100)}... Error: ${errorText}`);
            }
          } else {
            results.push(`✅ ${statement.substring(0, 50)}...`);
          }
        } catch (err: any) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            errors.push(`Statement error: ${statement.substring(0, 100)}... Error: ${err.message}`);
          }
        }
      }
    }
    
    // Test if core tables exist
    const verificationResults = {};
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      verificationResults.profiles = !profileError || profileError.message.includes('PGRST116');
    } catch {
      verificationResults.profiles = false;
    }
    
    try {
      const { error: voiceError } = await supabase
        .from('voice_profiles')
        .select('id')  
        .limit(1);
      verificationResults.voice_profiles = !voiceError || voiceError.message.includes('PGRST116');
    } catch {
      verificationResults.voice_profiles = false;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Schema deployment completed',
      results,
      errors: errors.length > 0 ? errors : null,
      verification: verificationResults,
      totalStatements: statements.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Schema deployment failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}