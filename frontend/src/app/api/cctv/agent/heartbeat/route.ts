import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_id, branch_id, camera_id, camera_status, disk_free_gb, cpu_percent } = body;

    if (!agent_id || !branch_id) {
      return NextResponse.json({ error: 'agent_id and branch_id are required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (camera_id) {
      await adminSupabase
        .from('cctv_cameras')
        .update({
          status: camera_status || 'ONLINE',
          last_heartbeat: now,
          agent_id
        })
        .eq('id', camera_id);
    }

    return NextResponse.json({
      success: true,
      status: 'ACK',
      timestamp: now,
      agent_id,
      branch_id,
      metrics: {
        disk_free_gb: disk_free_gb || 100,
        cpu_percent: cpu_percent || 15
      }
    });

  } catch (err: any) {
    console.error('CCTV Agent Heartbeat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}