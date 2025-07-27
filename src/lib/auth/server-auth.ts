import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { SessionManager } from './session-manager';

export interface AuthSession {
  token: string;
  employeeId: string;
  expiresAt: number;
}

export interface AuthenticatedUser {
  employeeId: string;
  token: string;
  sessionId: string;
}

const sessionManager = new SessionManager();

/**
 * Extract and validate authenticated user from request with enterprise-grade security
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    console.log('[server-auth] --- New Authentication Request ---');
    
    // 1. Check for Authorization header (preferred method)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('[server-auth] Attempting JWT validation');
      
      // Validate JWT and session in database
      const session = await sessionManager.validateSession(token);
      if (session) {
        console.log(`[server-auth] Successfully authenticated user: ${session.employee_id}`);
        return {
          employeeId: session.employee_id,
          token: session.session_token,
          sessionId: session.id
        };
      } else {
        console.warn('[server-auth] Invalid or expired JWT token');
      }
    }

    // 2. Check for session cookie (fallback)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const sessionCookie = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('session='));
      
      if (sessionCookie) {
        const sessionToken = sessionCookie.split('=')[1];
        const session = await sessionManager.validateSession(sessionToken);
        
        if (session) {
          console.log(`[server-auth] Successfully authenticated via cookie: ${session.employee_id}`);
          return {
            employeeId: session.employee_id,
            token: session.session_token,
            sessionId: session.id
          };
        }
      }
    }

    // 3. Development fallback (REMOVE IN PRODUCTION)
    if (process.env.NODE_ENV === 'development') {
      const devUserId = request.nextUrl.searchParams.get('userId');
      if (devUserId) {
        console.log(`[server-auth] DEV MODE: Authenticated via query parameter: ${devUserId}`);
        return {
          employeeId: devUserId,
          token: `dev-token-${devUserId}`,
          sessionId: `dev-session-${devUserId}`
        };
      }
    }
    
    console.warn('[server-auth] No valid authentication found');
    return null;
  } catch (error) {
    console.error('[server-auth] Critical error in authentication:', error);
    return null;
  }
}/**
 * Middleware to require authentication
 * Throws error if no valid session found
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Set user context for Row Level Security (RLS) in Supabase
 */
export async function setUserContextForRLS(employeeId: string): Promise<void> {
  try {
    const supabase = createServerClient();
    console.log(`[server-auth] Setting RLS context for user: ${employeeId}`);
    
    // Use the public schema function explicitly
    const { data, error: checkError } = await supabase.rpc('set_current_user_id', { user_id: employeeId });
    
    if (checkError && checkError.message.includes('function')) {
      console.warn('[server-auth] set_current_user_id function not found. RLS policies may not work correctly.');
      console.warn('[server-auth] Please run the RLS functions SQL script in your database.');
    } else if (checkError) {
      console.error('[server-auth] Error setting user context for RLS:', checkError);
    } else {
      console.log('[server-auth] RLS context set successfully', data);
    }
  } catch (error) {
    console.error('[server-auth] Error setting user context for RLS:', error);
    // Don't throw error here, as some queries might still work without RLS context
  }
}
