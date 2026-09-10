import { adminSupabase } from '@/lib/auth-server';

export interface SendSmsParams {
  phone: string;
  message: string;
  ticketNo?: string;
  amount?: number;
  type?: 'RECEIPT' | 'REDEEM' | 'REMINDER' | 'ALERT';
  branchId?: string;
}

export async function sendFreeSms(params: SendSmsParams) {
  const { phone, message, ticketNo, amount, type = 'RECEIPT', branchId = 'HQ' } = params;

  if (!phone || !message) {
    return { success: false, error: 'Phone and message required' };
  }

  // Format phone number to E.164 (e.g. +94771234567 or 0771234567)
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '+94' + cleanPhone.substring(1);
  }

  let smsSuccess = false;
  let dispatchNotice = '';

  try {
    // 1. Fetch Gateway Settings
    const { data: settingsData } = await adminSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_gateway_config')
      .single();

    const gatewayConfig = settingsData?.value || {
      enabled: true,
      gatewayUrl: 'http://192.168.1.50:8080/send',
      apiKey: 'MIFOS_SMS_SECRET_2026',
      simSlot: 1
    };

    if (gatewayConfig.gatewayUrl && gatewayConfig.gatewayUrl.startsWith('http')) {
      try {
        const smsRes = await fetch(gatewayConfig.gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gatewayConfig.apiKey || ''}`
          },
          body: JSON.stringify({
            to: cleanPhone,
            message: message,
            simSlot: gatewayConfig.simSlot || 1
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (smsRes.ok) {
          smsSuccess = true;
          dispatchNotice = 'SMS dispatched via Android SIM Gateway successfully!';
        } else {
          dispatchNotice = `Android SMS Gateway returned HTTP ${smsRes.status}`;
        }
      } catch (gatewayErr: any) {
        dispatchNotice = 'Local Android SIM Gateway offline or unreachable on Wi-Fi.';
      }
    } else {
      dispatchNotice = 'SMS Gateway URL not configured yet.';
    }

    // 2. Insert into sms_logs
    try {
      await adminSupabase.from('sms_logs').insert([{
        phone: cleanPhone,
        message,
        ticket_no: ticketNo || '',
        amount: amount || 0,
        type,
        status: smsSuccess ? 'SENT' : 'QUEUED',
        dispatch_notice: dispatchNotice,
        branch_id: branchId,
        created_at: new Date().toISOString()
      }]);
    } catch (insertErr) {
      console.warn('sms_logs insert notice:', insertErr);
    }

    return {
      success: true,
      status: smsSuccess ? 'SENT' : 'QUEUED',
      phone: cleanPhone,
      notice: dispatchNotice
    };
  } catch (err: any) {
    console.warn('sendFreeSms exception:', err);
    return { success: false, error: err?.message || 'Failed to dispatch SMS' };
  }
}
