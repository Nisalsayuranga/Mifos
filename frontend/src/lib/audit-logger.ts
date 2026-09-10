import { adminSupabase } from './auth-server';

export interface AuditLogOptions {
  action: string;
  resource?: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  role?: string;
  branchId?: string;
  status?: 'SUCCESS' | 'FAILED' | 'WARNING';
  request?: Request;
}

/**
 * Records an audit log entry in public.audit_logs
 */
export async function recordAuditLog(sessionOrUser: any, options: AuditLogOptions) {
  try {
    const userId = options.userId || sessionOrUser?.user?.id || sessionOrUser?.id || null;
    const userEmail = options.userEmail || sessionOrUser?.user?.email || sessionOrUser?.email || 'system';
    const role = options.role || sessionOrUser?.role || 'TELLER';
    const branchId = options.branchId || sessionOrUser?.branchId || sessionOrUser?.branch_id || 'HQ';

    let ipAddress = '127.0.0.1';
    let userAgent = 'Browser Client';

    if (options.request) {
      ipAddress = options.request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  options.request.headers.get('x-real-ip') || 
                  '127.0.0.1';
      userAgent = options.request.headers.get('user-agent') || 'Browser Client';
    }

    const payloadDetails = {
      ...(options.details || {}),
      status: options.status || 'SUCCESS',
      ip_address: ipAddress,
      user_agent: userAgent
    };

    await adminSupabase.from('audit_logs').insert([{
      user_id: userId,
      user_email: userEmail,
      role,
      branch_id: branchId,
      action: options.action,
      resource: options.resource || '',
      details: payloadDetails,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('[AuditLog Error]:', err);
    // Non-blocking error to ensure primary user transaction completes
  }
}
