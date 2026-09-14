/**
 * getAuthHeaders — Shared utility for all client-side API calls.
 *
 * Returns the necessary HTTP headers so that:
 *   1. The server can verify the caller's JWT (Authorization: Bearer <token>)
 *   2. The server knows which branch the teller is currently operating in (x-branch-id)
 *
 * This allows a single teller account to log into ANY branch, and the server will
 * scope all data queries to THAT branch — not the teller's home branch in the profiles table.
 */

export interface AuthHeaders {
  'Authorization'?: string;
  'x-branch-id'?: string;
  'Content-Type'?: string;
}

export interface UserSession {
  id?: string;
  email?: string;
  role: string;
  branchId: string;
  branchName?: string;
  username?: string;
}

/**
 * Reads auth token and selected branch from localStorage and returns
 * the headers object to attach to every API fetch call.
 */
export function getAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  if (typeof window === 'undefined') {
    // Server-side render — no localStorage
    return { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
  }

  const token = localStorage.getItem('auth_token') || '';
  const storedUser = localStorage.getItem('user');
  let branchId = '';

  if (storedUser) {
    try {
      const user: UserSession = JSON.parse(storedUser);
      branchId = user.branchId || '';
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (branchId) {
    headers['x-branch-id'] = branchId;
  }

  return headers;
}

/**
 * Reads and returns the current user session from localStorage.
 * Returns null if not authenticated.
 */
export function getCurrentUser(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Returns headers suitable for multipart/form-data or non-JSON requests
 * (omits Content-Type so the browser sets it with the boundary).
 */
export function getAuthHeadersNoContentType(): Record<string, string> {
  const headers = getAuthHeaders();
  delete headers['Content-Type'];
  return headers;
}
