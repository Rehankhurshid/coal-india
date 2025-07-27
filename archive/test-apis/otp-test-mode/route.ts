import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/auth/otp-test-mode - Get OTP for test mode in Vercel
 * This endpoint is protected by a secret key for security
 */
export async function GET(request: NextRequest) {
  try {
    // Check for test mode environment variable
    const isTestMode = process.env.ENABLE_OTP_TEST_MODE === 'true';
    const testModeKey = process.env.OTP_TEST_MODE_KEY;
    
    if (!isTestMode) {
      return NextResponse.json(
        { error: 'OTP test mode is not enabled' },
        { status: 403 }
      );
    }

    // Verify the secret key from query params or headers
    const searchParams = request.nextUrl.searchParams;
    const providedKey = searchParams.get('key') || request.headers.get('x-otp-test-key');
    
    if (!testModeKey || providedKey !== testModeKey) {
      return NextResponse.json(
        { error: 'Invalid or missing test mode key' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const employeeId = searchParams.get('employeeId');
    const sessionId = searchParams.get('sessionId');

    let query = supabase
      .from('otp_verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId.toUpperCase());
    }

    const { data: otpRecords, error } = await query;

    if (error) {
      console.error('OTP fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch OTP records', details: error.message },
        { status: 500 }
      );
    }

    const formattedRecords = otpRecords?.map(record => ({
      employee_id: record.employee_id,
      otp_code: record.otp_code,
      session_id: record.session_id,
      verified: record.verified,
      expires_at: record.expires_at,
      created_at: record.created_at,
      is_expired: new Date(record.expires_at) < new Date()
    }));

    // Also log to Vercel Functions logs
    console.log('OTP Test Mode Request:', {
      employeeId,
      sessionId,
      recordsFound: formattedRecords?.length || 0
    });

    return NextResponse.json({
      success: true,
      mode: 'test',
      records: formattedRecords,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OTP test mode error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/otp-test-mode - Create a test OTP for specific employee
 * This allows creating OTPs for testing without SMS
 */
export async function POST(request: NextRequest) {
  try {
    const isTestMode = process.env.ENABLE_OTP_TEST_MODE === 'true';
    const testModeKey = process.env.OTP_TEST_MODE_KEY;
    
    if (!isTestMode) {
      return NextResponse.json(
        { error: 'OTP test mode is not enabled' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, employeeId } = body;
    
    if (!testModeKey || key !== testModeKey) {
      return NextResponse.json(
        { error: 'Invalid or missing test mode key' },
        { status: 401 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Generate a simple test OTP
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log to Vercel Functions logs
    console.log(`📱 Test OTP Generated for ${employeeId}: ${testOtp}`);
    console.log('View this in Vercel Dashboard > Functions > Logs');

    return NextResponse.json({
      success: true,
      employeeId,
      otp: testOtp,
      message: 'Test OTP generated (check Vercel Functions logs)',
      vercelLogsUrl: 'https://vercel.com/dashboard/functions'
    });

  } catch (error) {
    console.error('OTP test mode POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test OTP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
