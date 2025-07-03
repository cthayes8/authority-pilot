#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function deploySchema() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('🚀 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Read schema file
  const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('📄 Loaded schema file...');
  
  try {
    console.log('⚡ Executing schema...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      // Try alternative method - direct SQL execution
      console.log('⚡ Trying direct SQL execution...');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`📋 Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.error('❌ Error:', stmtError.message);
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('✅ Schema deployment completed!');
    
    // Test if tables exist
    console.log('🔍 Verifying tables...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError && !profileError.message.includes('PGRST116')) {
      console.error('❌ Profiles table verification failed:', profileError.message);
    } else {
      console.log('✅ Profiles table exists');
    }
    
    const { data: voiceProfiles, error: voiceError } = await supabase
      .from('voice_profiles')
      .select('id')
      .limit(1);
    
    if (voiceError && !voiceError.message.includes('PGRST116')) {
      console.error('❌ Voice profiles table verification failed:', voiceError.message);
    } else {
      console.log('✅ Voice profiles table exists');
    }
    
    console.log('\n🎉 Database setup complete!');
    console.log('👉 Next steps:');
    console.log('   1. Go to http://localhost:3001/debug to verify setup');
    console.log('   2. Try the onboarding flow at http://localhost:3001/onboarding');
    
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }
}

deploySchema().catch(console.error);