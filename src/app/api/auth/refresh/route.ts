import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/auth/session-manager';

const sessionManager = new SessionManager();

interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  message: string;
}

/**
 * POST /api/auth/refresh - Refresh access token
 */
export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
  try {
    // Get refresh token from cookie or request body
    let refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Refresh the session
    const refreshResult = await sessionManager.refreshSession(refreshToken);
    
    if (!refreshResult) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      accessToken: refreshResult.accessToken,
      expiresAt: refreshResult.expiresAt.toISOString(),
      message: 'Token refreshed successfully'
    });

    // Update session cookie
    response.cookies.set('session', refreshResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: refreshResult.expiresAt
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
