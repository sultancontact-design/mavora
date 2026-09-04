import { createClient } from '@supabase/supabase-js';

// Read from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kyanecjjautqmuowbtvy.supabase.co';

// We need to use a simple approach - read .env.local
import { config } from 'dotenv';
config({ path: '.env' });  // Load from .env not .env.local

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('=== Categories API Diagnostic ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Has Anon Key:', !!supabaseKey, supabaseKey ? `(length: ${supabaseKey.length})` : '');

if (!supabaseKey) {
  console.error('ERROR: No Supabase anon key found!');
  console.error('Check that NEXT_PUBLIC_SUPABASE_ANON_KEY is set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategories() {
  // First, let's see what columns exist
  console.log('\n--- Test 1: Basic select (no filters) ---');
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(2);
    
    if (error) {
      console.error('Error:', error.message, error.code, error.hint);
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} categories`);
      if (data?.[0]) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (e) {
    console.error('Exception:', e);
  }

  // Test with camelCase
  console.log('\n--- Test 2: Filter by isActive (camelCase) ---');
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .limit(2);
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} active categories`);
    }
  } catch (e) {
    console.error('Exception:', e);
  }

  // Test with snake_case
  console.log('\n--- Test 3: Filter by is_active (snake_case) ---');
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .limit(2);
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`✅ Success! Found ${data?.length || 0} active categories`);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

testCategories().catch(console.error);
