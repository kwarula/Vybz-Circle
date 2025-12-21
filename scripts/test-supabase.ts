
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
       // Table might not exist yet, but connection should be okay if code is specific
       console.error('Supabase Error:', error.message);
       if (error.code === 'PGRST116') {
         console.log('Connection successful (Table not found, which is expected if schema is empty)');
       }
    } else {
      console.log('Connection Successful! Data:', data);
    }
    
    // Check Auth service status (often reliable test)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.error('Auth Error:', authError.message);
    } else {
        console.log('Auth Service Reachable. Session:', session ? 'Active' : 'None');
    }

  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

testConnection();
