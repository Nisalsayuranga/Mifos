import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    
    if (session && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Admins can modify SMS Gateway settings.' }, { status: 403 });
    }

    const body = await req.json();
    const { gatewayUrl, apiKey, simSlot, enabled } = body;

    const configValue = {
      gatewayUrl: gatewayUrl || 'http://192.168.1.50:8080/send',
      apiKey: apiKey || 'MIFOS_SMS_SECRET_2026',
      simSlot: simSlot || 1,
      enabled: enabled !== false,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await adminSupabase
      .from('system_settings')
      .upsert({
        key: 'sms_gateway_config',
        value: configValue,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (session) {
      await recordAuditLog(session, {
        action: 'UPDATE_SMS_GATEWAY_CONFIG',
        resource: 'system_settings:sms_gateway_config',
        details: configValue
      });
    }

    return NextResponse.json({ success: true, config: configValue });

  } catch (err: any) {
    console.error('Error in /api/settings/sms-gateway:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
