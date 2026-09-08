/**
 * PROPIX — Supabase Browser Client
 *
 * Use this client ONLY inside Client Components ("use client").
 * Creates a single Supabase client instance for the browser using
 * the publishable key (safe for browser exposure).
 *
 * The anon/publishable key is safe to expose in the browser — all
 * data access is controlled by Supabase Row Level Security (RLS).
 *
 * DO NOT import this file in Server Components, Server Actions,
 * or Route Handlers. Use @/lib/supabase/server instead.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";

  return createBrowserClient(url, key);
}
