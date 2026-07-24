import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const oldSupabase = createClient(
  'https://zxsxxipvcchpqgttmzvi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4c3h4aXB2Y2NocHFndHRtenZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5NTE4MywiZXhwIjoyMTAwMzcxMTgzfQ.irz2Fn5P82SZ6EZMOpwAqGYandhWR4VIdNW6XTKuHn8'
);
