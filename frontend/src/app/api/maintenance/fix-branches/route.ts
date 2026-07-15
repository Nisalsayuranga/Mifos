import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const logs: string[] = [];

    // 1. Find branches with long IDs (UUID-like)
    const { data: branches, error: bError } = await supabase
      .from('branches')
      .select('*');

    if (bError) throw bError;

    const uuidBranches = branches.filter((b: any) => b.id.length > 10);
    logs.push(`Found ${uuidBranches.length} branches with long IDs.`);

    for (const branch of uuidBranches) {
      let targetId = '';
      if (branch.name.toLowerCase().includes('dehiwala')) targetId = 'DHW';
      // Add other mappings if needed, or fallback to first 3 letters
      else targetId = branch.name.substring(0, 3).toUpperCase();

      logs.push(`Migrating branch "${branch.name}" from ${branch.id} to ${targetId}...`);

      // Check if targetId already exists
      const { data: existing } = await supabase.from('branches').select('id').eq('id', targetId).maybeSingle();
      
      if (!existing) {
        // Create new branch
        const { error: insError } = await supabase.from('branches').insert({
          ...branch,
          id: targetId
        });
        if (insError) {
          logs.push(`  Failed to insert new branch ${targetId}: ${insError.message}`);
          continue;
        }
        logs.push(`  Created branch ${targetId}.`);
      } else {
        logs.push(`  Branch ${targetId} already exists, proceeding to update profiles.`);
      }

      // Update profiles
      const { data: updateRes, error: uError, count } = await supabase
        .from('profiles')
        .update({ branch_id: targetId })
        .eq('branch_id', branch.id)
        .select();

      if (uError) {
        logs.push(`  Failed to update profiles for ${branch.id}: ${uError.message}`);
      } else {
        logs.push(`  Updated ${updateRes?.length || 0} profiles to use ${targetId}.`);
      }
      
      // Update branch_status if exists
      await supabase.from('branch_status').update({ branch_id: targetId }).eq('branch_id', branch.id);

      // Keep the old branch for now to be safe, or delete if profiles updated
      // If we are confident, delete:
      const { error: delError } = await supabase.from('branches').delete().eq('id', branch.id);
      if (delError) logs.push(`  Could not delete old branch ${branch.id}: ${delError.message}`);
      else logs.push(`  Deleted old branch ${branch.id}.`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
