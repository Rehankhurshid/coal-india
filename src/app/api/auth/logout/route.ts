import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import { SessionManager } from '@/lib/auth/session-manager';

const sessionManager = new SessionManager();

interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * POST /api/auth/logout - Logout and invalidate session
 */
export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (authenticatedUser) {
      // Invalidate the current session
      await sessionManager.invalidateSession(authenticatedUser.sessionId);
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear authentication cookies
    response.cookies.delete('session');
    response.cookies.delete('refresh_token');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
