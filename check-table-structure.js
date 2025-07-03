#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if linkedin_accounts table exists and get its structure
    console.log('🔍 Checking linkedin_accounts table structure...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'linkedin_accounts' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('❌ Error checking table structure:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ linkedin_accounts table does not exist or has no columns');
      return;
    }
    
    console.log('✅ linkedin_accounts table structure:');
    console.log('Column Name\t\tData Type\t\tNullable\tDefault');
    console.log('━'.repeat(80));
    
    data.forEach(col => {
      const name = col.column_name.padEnd(20);
      const type = col.data_type.padEnd(20);
      const nullable = col.is_nullable.padEnd(10);
      const defaultVal = (col.column_default || '').substring(0, 20);
      console.log(`${name}\t${type}\t${nullable}\t${defaultVal}`);
    });
    
    // Check specifically for expires_at column
    const expiresAtCol = data.find(col => col.column_name === 'expires_at');
    const tokenExpiresAtCol = data.find(col => col.column_name === 'token_expires_at');
    
    console.log('\n🔍 Checking for expires_at related columns:');
    if (expiresAtCol) {
      console.log('✅ expires_at column exists');
    } else {
      console.log('❌ expires_at column does NOT exist');
    }
    
    if (tokenExpiresAtCol) {
      console.log('✅ token_expires_at column exists');
    } else {
      console.log('❌ token_expires_at column does NOT exist');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTableStructure().catch(console.error);