import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jznofbfhtknmdiknnraw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bm9mYmZodGtubWRpa25ucmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDI5MjAsImV4cCI6MjA3OTY3ODkyMH0.AmbutMPyDa5fCdQHPbFP8nmjRJ8MIvujtDkFWpqKOV4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
})
