import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/auth/session-manager';
import { createServerClient } from '@/lib/supabase-server';
import { AUTH_CONFIG } from '@/lib/auth/auth-config';

const sessionManager = new SessionManager();

interface VerifyOTPRequest {
  sessionId: string;
  otp: string;
}

interface VerifyOTPResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  employee?: any;
  message: string;
}

/**
 * POST /api/auth/verify-otp - Verify OTP and create session
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyOTPResponse>> {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const body = await request.json();
    const { sessionId, otp }: VerifyOTPRequest = body;

    if (!sessionId || !otp) {
      return NextResponse.json(
        { success: false, message: 'Session ID and OTP are required' },
        { status: 400 }
      );
    }

    // Development mode: Accept "123456" as valid OTP in development
    let employeeId: string | null = null;
    
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      // In dev mode, extract employee ID from session ID (which should be the employee ID)
      employeeId = sessionId;
      console.log(`[verify-otp] Development mode: Using sessionId as employeeId: ${employeeId}`);
    } else {
      // Production mode: Verify OTP normally
      employeeId = await sessionManager.verifyOTP(sessionId, otp);
    }
    
    if (!employeeId) {
      await sessionManager.logLoginAttempt(undefined, clientIP, userAgent, false, 'Invalid OTP');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Get employee details
    const supabase = createServerClient();
    console.log(`[verify-otp] Looking up employee with emp_code: ${employeeId}`);
    
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('emp_code', employeeId)
      .eq('is_active', true)
      .single();

    console.log(`[verify-otp] Employee lookup result:`, { employee, error });

    if (error || !employee) {
      await sessionManager.logLoginAttempt(employeeId, clientIP, userAgent, false, 'Employee not found');
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create authenticated session
    const { accessToken, refreshToken, expiresAt } = await sessionManager.createSession(
      employeeId,
      userAgent,
      clientIP
    );

    await sessionManager.logLoginAttempt(employeeId, clientIP, userAgent, true);

    // Create secure HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      employee: {
        emp_code: employee.emp_code,
        name: employee.name,
        designation: employee.designation,
        dept: employee.dept,
        email_id: employee.email_id
      },
      message: 'Login successful'
    });

    // Set secure cookies
    response.cookies.set('session', accessToken, {
      ...AUTH_CONFIG.COOKIE_OPTIONS,
      expires: expiresAt
    });

    response.cookies.set('refresh_token', refreshToken, {
      ...AUTH_CONFIG.COOKIE_OPTIONS,
      expires: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_DURATION)
    });

    return response;

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
