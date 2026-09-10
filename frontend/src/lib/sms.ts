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

    const defaultTextbeeUrl = 'https://api.textbee.dev/api/v1/gateway/devices/6aa2895cccb6c72709fa5556/send-sms';
    const defaultTextbeeApiKey = 'txb_SQX87S1btDchmgxYURa40D3I3WEjxSqg';

    const gatewayConfig = settingsData?.value || {
      enabled: true,
      provider: 'TEXTBEE',
      gatewayUrl: defaultTextbeeUrl,
      apiKey: defaultTextbeeApiKey,
      deviceId: '6aa2895cccb6c72709fa5556',
      simSlot: 1
    };

    const targetUrl = gatewayConfig.gatewayUrl || defaultTextbeeUrl;
    const targetApiKey = gatewayConfig.apiKey || defaultTextbeeApiKey;

    if (targetUrl.includes('textbee.dev') || gatewayConfig.provider === 'TEXTBEE') {
      try {
        const textbeeEndpoint = targetUrl.includes('/send-sms') 
          ? targetUrl 
          : `https://api.textbee.dev/api/v1/gateway/devices/${gatewayConfig.deviceId || '6aa2895cccb6c72709fa5556'}/send-sms`;

        const smsRes = await fetch(textbeeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': targetApiKey
          },
          body: JSON.stringify({
            recipients: [cleanPhone],
            message: message
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (smsRes.ok) {
          smsSuccess = true;
          dispatchNotice = 'SMS dispatched via TextBee Cloud Gateway successfully!';
        } else {
          const errText = await smsRes.text();
          dispatchNotice = `TextBee Gateway returned HTTP ${smsRes.status}: ${errText}`;
        }
      } catch (textbeeErr: any) {
        dispatchNotice = `TextBee Error: ${textbeeErr?.message || 'Gateway connection failed'}`;
      }
    } else if (targetUrl.startsWith('http')) {
      try {
        const smsRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${targetApiKey}`
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
          dispatchNotice = `Android Gateway returned HTTP ${smsRes.status}`;
        }
      } catch (gatewayErr: any) {
        dispatchNotice = 'Local Android SIM Gateway offline or unreachable.';
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
