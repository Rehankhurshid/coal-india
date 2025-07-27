import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/auth/get-otp-debug - Debug endpoint to view OTP codes
 * For development use only - shows recent OTP codes
 */
export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = createServerClient();
    
    // Get sessionId from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const employeeId = searchParams.get('employeeId');

    let query = supabase
      .from('otp_verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId.toUpperCase());
    }

    const { data: otpRecords, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch OTP records', details: error },
        { status: 500 }
      );
    }

    // Format the response to show important info
    const formattedRecords = otpRecords?.map(record => ({
      employee_id: record.employee_id,
      phone: record.phone || record.phone_number,
      otp_code: record.otp_code,
      session_id: record.session_id,
      verified: record.verified,
      expires_at: record.expires_at,
      created_at: record.created_at,
      is_expired: new Date(record.expires_at) < new Date()
    }));

    return NextResponse.json({
      success: true,
      message: 'Recent OTP codes (for development debugging only)',
      records: formattedRecords,
      tip: 'In development mode, you can also use OTP: 123456'
    });

  } catch (error) {
    console.error('Debug OTP fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch OTP records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
