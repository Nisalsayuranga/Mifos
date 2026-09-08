/**
 * PROPIX — Supabase Connection Health Check
 *
 * Route: GET /api/supabase-health
 *
 * PURPOSE:
 * Verifies that the Supabase client can be initialized with the
 * environment variables loaded from .env.local.
 *
 * SAFETY:
 * - Does NOT query any database tables (schema not yet created).
 * - Does NOT expose credentials or any private data.
 * - Only returns whether the URL and key env vars are present.
 * - Safe to call during development for connection verification.
 *
 * REMOVE or PROTECT this endpoint before going to production.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to initialize the server Supabase client.
    // This exercises the createServerClient + cookies() wiring
    // without making any real DB requests.
    const supabase = await createClient();

    // Confirm the client object was created (truthy check only).
    const initialized = !!supabase;

    return NextResponse.json({
      ok: true,
      initialized,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "✅ NEXT_PUBLIC_SUPABASE_URL is set"
        : "❌ NEXT_PUBLIC_SUPABASE_URL is missing",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? "✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set"
        : "❌ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing",
      message:
        "Supabase client initialized successfully. No DB queries were made — schema not yet created.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to initialize Supabase client. Check your .env.local.",
      },
      { status: 500 }
    );
  }
}
