/**
 * PROPIX — Supabase Storage Bucket Setup
 *
 * Route: GET /api/setup-storage
 *
 * PURPOSE:
 * Programmatically creates the two required Supabase Storage buckets
 * defined in supabase/migrations/001_initial_schema.sql (lines 1278–1296):
 *
 *   1. property-images  — PUBLIC  — 10 MB  — images only
 *   2. property-documents — PRIVATE — 20 MB — PDF + images
 *
 * Uses the SUPABASE_SERVICE_ROLE_KEY (server-only) to bypass RLS.
 * Safe to run multiple times — existing buckets are reported but not overwritten.
 *
 * REMOVE or PROTECT this endpoint before going to production.
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Service-role client — bypasses RLS, server-only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET() {
  const results: Record<string, string> = {};

  // ──────────────────────────────────────────────────────────────
  // Bucket 1: property-images
  // Public: YES  |  Limit: 10 MB  |  Types: JPEG, PNG, WebP, GIF
  // ──────────────────────────────────────────────────────────────
  const { error: imgErr } = await supabase.storage.createBucket(
    "property-images",
    {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB in bytes
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
    }
  );

  if (imgErr) {
    // "already exists" is not a real error — report it clearly
    results["property-images"] = imgErr.message.includes("already exists")
      ? "✅ Already exists (skipped)"
      : `❌ Error: ${imgErr.message}`;
  } else {
    results["property-images"] = "✅ Created successfully (Public, 10 MB limit)";
  }

  // ──────────────────────────────────────────────────────────────
  // Bucket 2: property-documents
  // Public: NO (PRIVATE)  |  Limit: 20 MB  |  Types: PDF, JPEG, PNG, Word
  // ──────────────────────────────────────────────────────────────
  const { error: docErr } = await supabase.storage.createBucket(
    "property-documents",
    {
      public: false, // PRIVATE — confidential legal documents
      fileSizeLimit: 20 * 1024 * 1024, // 20 MB in bytes
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    }
  );

  if (docErr) {
    results["property-documents"] = docErr.message.includes("already exists")
      ? "✅ Already exists (skipped)"
      : `❌ Error: ${docErr.message}`;
  } else {
    results["property-documents"] =
      "✅ Created successfully (PRIVATE, 20 MB limit)";
  }

  // ──────────────────────────────────────────────────────────────
  // Final response
  // ──────────────────────────────────────────────────────────────
  const allOk = Object.values(results).every((r) => r.startsWith("✅"));

  return NextResponse.json({
    ok: allOk,
    buckets: results,
    note: "Remove or protect this endpoint before going to production.",
    timestamp: new Date().toISOString(),
  });
}
