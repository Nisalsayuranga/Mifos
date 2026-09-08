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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
