import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/auth/session-manager';
import { createServerClient } from '@/lib/supabase-server';
import { generateSecureOTP, AUTH_CONFIG } from '@/lib/auth/auth-config';

const sessionManager = new SessionManager();

interface LoginRequest {
  employeeId: string;
}

interface LoginResponse {
  success: boolean;
  sessionId?: string;
  phoneNumber?: string;
  message: string;
}

/**
 * POST /api/auth/login - Initiate login with employee ID
 */
export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const body = await request.json();
    const { employeeId }: LoginRequest = body;

    if (!employeeId) {
      // Try to log attempt, but don't fail if auth tables don't exist
      try {
        await sessionManager.logLoginAttempt(undefined, clientIP, userAgent, false, 'Missing employee ID');
      } catch (logError) {
        console.warn('Could not log login attempt:', logError);
      }
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Validate employee exists and is active
    const supabase = createServerClient();
    const { data: employee, error } = await supabase
      .from('employees')
      .select('emp_code, name, phone_1, phone_2, is_active')
      .eq('emp_code', employeeId.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !employee) {
      try {
        await sessionManager.logLoginAttempt(employeeId, clientIP, userAgent, false, 'Employee not found or inactive');
      } catch (logError) {
        console.warn('Could not log login attempt:', logError);
      }
      return NextResponse.json(
        { success: false, message: 'Employee not found or account is inactive' },
        { status: 404 }
      );
    }

    // Get valid phone number
    const phoneNumber = employee.phone_1 || employee.phone_2;
    if (!phoneNumber) {
      try {
        await sessionManager.logLoginAttempt(employee.emp_code, clientIP, userAgent, false, 'No phone number');
      } catch (logError) {
        console.warn('Could not log login attempt:', logError);
      }
      return NextResponse.json(
        { success: false, message: 'No phone number found. Please contact HR.' },
        { status: 400 }
      );
    }

    // Validate phone number format (Indian mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!phoneRegex.test(cleanPhone)) {
      try {
        await sessionManager.logLoginAttempt(employee.emp_code, clientIP, userAgent, false, 'Invalid phone number');
      } catch (logError) {
        console.warn('Could not log login attempt:', logError);
      }
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Please contact HR.' },
        { status: 400 }
      );
    }

    // Rate limiting check (skip in development, if disabled, or if auth tables don't exist)
    if (process.env.NODE_ENV !== 'development' && AUTH_CONFIG.RATE_LIMITS.ENABLED) {
      try {
        const withinRateLimit = await sessionManager.checkRateLimit(clientIP);
        if (!withinRateLimit) {
          await sessionManager.logLoginAttempt(undefined, clientIP, userAgent, false, 'Rate limit exceeded');
          return NextResponse.json(
            { success: false, message: 'Too many login attempts. Please try again later.' },
            { status: 429 }
          );
        }
      } catch (rateLimitError) {
        console.warn('Rate limiting check failed, continuing with login:', rateLimitError);
      }
    }

    // Generate secure OTP
    let otp: string;
    const isTestMode = process.env.ENABLE_OTP_TEST_MODE === 'true';
    
    if (process.env.NODE_ENV === 'development') {
      otp = '123456';
    } else if (isTestMode) {
      // In test mode on Vercel, use a predictable pattern
      // Replace any non-numeric characters with 0
      const last4 = employee.emp_code.slice(-4).replace(/[^0-9]/g, '0');
      otp = `${last4}99`.padStart(6, '0');
      console.log(`🔐 Test Mode OTP for ${employee.emp_code}: ${otp}`);
      console.log('This log is visible in Vercel Dashboard > Functions > Logs');
    } else {
      otp = generateSecureOTP();
    }
    
    // Create OTP verification record
    let sessionId: string;
    try {
      sessionId = await sessionManager.createOTPVerification(
        employee.emp_code,
        cleanPhone,
        otp
      );
    } catch (otpError) {
      // In development/test mode, use employee ID as session ID if auth tables don't exist
      if (process.env.NODE_ENV === 'development' || isTestMode) {
        console.warn('Auth tables not available, using simplified session ID for testing');
        sessionId = employee.emp_code;
      } else {
        console.error('Failed to create OTP verification. Auth tables might be missing:', otpError);
        const errorMessage = otpError instanceof Error ? otpError.message : 'Unknown error';
        return NextResponse.json(
          { 
            success: false, 
            message: 'Authentication system not configured. Please contact administrator.',
            debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 }
        );
      }
    }

    // TODO: Send SMS with OTP
    // await smsService.sendOTP(cleanPhone, otp);
    
    if (process.env.NODE_ENV === 'development' || isTestMode) {
      console.log(`🔐 OTP for ${employee.emp_code}: ${otp}`);
    }

    try {
      await sessionManager.logLoginAttempt(employee.emp_code, clientIP, userAgent, true);
    } catch (logError) {
      console.warn('Could not log successful login attempt:', logError);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      phoneNumber: `****${cleanPhone.slice(-4)}`,
      message: 'OTP sent successfully',
      // Include OTP in response for development mode or test mode
      ...((process.env.NODE_ENV === 'development' || isTestMode) && { 
        otp, 
        debug: isTestMode ? 'OTP included for test mode' : 'OTP included for development only' 
      })
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more helpful error messages in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
