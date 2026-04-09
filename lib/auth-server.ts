import { supabaseAdmin } from './supabase-admin';
import type { User } from '@supabase/supabase-js';

/**
 * Verifies the Bearer token from an API request.
 * Returns the authenticated Supabase user or null.
 */
export async function getAuthUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

/**
 * Verifies the X-Internal-Secret header for routes called by external systems
 * (Make.com automations, Supabase webhooks, etc.)
 */
export function verifyInternalSecret(req: Request): boolean {
  const secret = req.headers.get('X-Internal-Secret');
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;
  return secret === expected;
}
