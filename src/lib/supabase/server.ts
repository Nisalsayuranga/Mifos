/**
 * PROPIX — Supabase Server Client
 *
 * Use this client in:
 *   - Server Components (async components)
 *   - Server Actions ("use server" functions)
 *   - Route Handlers (app/api/*\/route.ts)
 *
 * This client correctly wires Supabase to Next.js cookies so that
 * when we migrate authentication in Step 2, the session will be
 * available server-side via the cookie store.
 *
 * IMPORTANT: In Next.js 16 (this project), cookies() is ASYNC.
 * We must await cookies() before passing it to createServerClient.
 *
 * DO NOT use this in Client Components. Use @/lib/supabase/client instead.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // In Next.js 16+, cookies() is an async function — must be awaited.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies cannot be
            // set in that context. This is safe to ignore; session refresh
            // will be handled by middleware in Step 2 (auth migration).
          }
        },
      },
    }
  );
}
