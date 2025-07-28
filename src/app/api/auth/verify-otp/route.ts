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

    // Development mode: Accept "123456" as valid OTP
    let employeeId: string | null = null;
    
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      // In dev mode with bypass OTP, try to get employee ID from OTP verification table first
      try {
        employeeId = await sessionManager.verifyOTP(sessionId, otp);
      } catch (error) {
        console.log(`[verify-otp] OTP verification failed, trying development fallback`);
      }
      
      // If OTP verification failed, try development fallback
      if (!employeeId) {
        // Look up the OTP verification record to get the actual employee ID
        const supabase = createServerClient();
        const { data: verification } = await supabase
          .from('otp_verifications')
          .select('employee_id')
          .eq('session_id', sessionId)
          .single();
          
        if (verification) {
          employeeId = verification.employee_id;
          console.log(`[verify-otp] Development mode: Found employee_id from verification: ${employeeId}`);
        } else {
          // Final fallback: assume sessionId is employee_id (when auth tables fallback to emp_code)
          employeeId = sessionId;
          console.log(`[verify-otp] Development mode: Using sessionId as employeeId: ${employeeId}`);
        }
      }
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
    
    let { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('emp_code', employeeId)
      .eq('is_active', true)
      .single();

    console.log(`[verify-otp] Employee lookup result:`, { employee, error });

    // Development mode: Create temporary employee if not found
    if ((error || !employee) && process.env.NODE_ENV === 'development') {
      console.log(`[verify-otp] Development mode: Creating temporary employee for ${employeeId}`);
      
      const tempEmployee = {
        emp_code: employeeId,
        name: `Test User ${employeeId}`,
        designation: 'Developer',
        department: 'IT',
        email: `${employeeId.toLowerCase()}@test.com`,
        phone_1: '+919876543210',
        is_active: true
      };

      // Try to insert temp employee, but don't fail if it already exists
      try {
        const { data: insertedEmployee } = await supabase
          .from('employees')
          .insert(tempEmployee)
          .select()
          .single();
        
        employee = insertedEmployee;
      } catch (insertError) {
        console.log(`[verify-otp] Could not insert temp employee, using temporary data:`, insertError);
        employee = tempEmployee;
      }
      error = null;
    }

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
    
    // Also log to login_logs table for admin tracking
    try {
      const AdminService = (await import('@/lib/services/admin.service')).AdminService;
      await AdminService.logUserLogin(employeeId, employee.name, clientIP, userAgent);
    } catch (error) {
      console.log('[verify-otp] Failed to log to login_logs:', error);
    }

    // Create secure HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      employee: {
        id: employee.id, // Include the ID field
        emp_code: employee.emp_code,
        name: employee.name,
        designation: employee.designation,
        dept: employee.dept || employee.department,
        email_id: employee.email_id || employee.email,
        phone_1: employee.phone_1,
        is_active: employee.is_active
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
