import { adminSupabase } from './auth-server';

export interface AuditLogOptions {
  action: string;
  resource?: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  role?: string;
  branchId?: string;
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

    await adminSupabase.from('audit_logs').insert([{
      user_id: userId,
      user_email: userEmail,
      role,
      branch_id: branchId,
      action: options.action,
      resource: options.resource || '',
      details: options.details || {},
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('[AuditLog Error]:', err);
    // Non-blocking error to ensure primary user transaction completes
  }
}
