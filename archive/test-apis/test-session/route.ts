import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session cookie found' 
      });
    }

    // Parse the session from localStorage format
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      
      // Check if session is expired
      const expiresAt = new Date(sessionData.expiresAt);
      const isExpired = expiresAt < new Date();
      
      return NextResponse.json({
        authenticated: !isExpired,
        session: {
          sessionId: sessionData.sessionId,
          employeeId: sessionData.employeeId,
          employeeName: sessionData.employeeName,
          expiresAt: sessionData.expiresAt,
          isExpired
        }
      });
    } catch (e: any) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'Invalid session data',
        error: e.message
      });
    }
  } catch (error: any) {
    console.error('Session test error:', error);
    return NextResponse.json({ 
      error: 'Failed to check session',
      message: error.message 
    }, { status: 500 });
  }
}

// Set a test session cookie
export async function POST(request: NextRequest) {
  try {
    const { employeeId = '3000' } = await request.json().catch(() => ({}));
    
    const testSession = {
      sessionId: `test-${Date.now()}`,
      employeeId: employeeId,
      employeeName: `Test User ${employeeId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    const cookieStore = await cookies();
    cookieStore.set('auth_session', encodeURIComponent(JSON.stringify(testSession)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    return NextResponse.json({
      success: true,
      session: testSession,
      message: 'Test session created successfully'
    });
  } catch (error: any) {
    console.error('Set session error:', error);
    return NextResponse.json({ 
      error: 'Failed to set session',
      message: error.message 
    }, { status: 500 });
  }
}
