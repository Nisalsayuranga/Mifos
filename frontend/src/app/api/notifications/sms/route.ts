import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';
import { sendFreeSms } from '@/lib/sms';

export const dynamic = 'force-dynamic';

/**
 * Dispatches automated SMS receipts via local Android SIM SMS Gateway
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    const body = await req.json();
    const { phone, message, ticketNo, amount, type } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    const result = await sendFreeSms({
      phone,
      message,
      ticketNo,
      amount,
      type: type || 'RECEIPT',
      branchId: session?.branchId || 'HQ'
    });

    if (session) {
      await recordAuditLog(session, {
        action: 'SMS_DISPATCH',
        resource: `sms:${result.phone || phone}`,
        details: { phone: result.phone || phone, ticketNo, amount, status: result.status, notice: result.notice }
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/notifications/sms:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET handler to check SMS logs and gateway configuration
 */
export async function GET(req: Request) {
  try {
    const { data: logs } = await adminSupabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: settingsData } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_gateway_config')
      .single();

    return NextResponse.json({
      logs: logs || [],
      config: settingsData?.value || {
        enabled: true,
        gatewayUrl: 'http://192.168.1.50:8080/send',
        apiKey: 'MIFOS_SMS_SECRET_2026',
        simSlot: 1
      }
    });
  } catch (err: any) {
    return NextResponse.json({ logs: [], config: {} });
  }
}
