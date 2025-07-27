import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { AUTH_CONFIG } from '@/lib/auth/auth-config';

/**
 * POST /api/auth/clear-rate-limit - Clear rate limit for specific IP or employee
 * Requires secret key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check for secret key
    const secretKey = request.headers.get('x-secret-key');
    const expectedKey = process.env.RATE_LIMIT_CLEAR_KEY || process.env.OTP_TEST_MODE_KEY;
    
    if (!expectedKey || secretKey !== expectedKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ipAddress, employeeId, clearAll } = body;

    const supabase = createServerClient();
    
    // Calculate time window
    const timeWindow = new Date(Date.now() - AUTH_CONFIG.RATE_LIMITS.TIME_WINDOW);

    let query = supabase
      .from('login_attempts')
      .delete();

    if (clearAll) {
      // Clear all recent failed attempts
      query = query
        .eq('success', false)
        .gte('created_at', timeWindow.toISOString());
    } else if (ipAddress) {
      // Clear for specific IP
      query = query
        .eq('ip_address', ipAddress)
        .eq('success', false)
        .gte('created_at', timeWindow.toISOString());
    } else if (employeeId) {
      // Clear for specific employee
      query = query
        .eq('employee_id', employeeId)
        .eq('success', false)
        .gte('created_at', timeWindow.toISOString());
    } else {
      return NextResponse.json(
        { success: false, message: 'Provide ipAddress, employeeId, or clearAll flag' },
        { status: 400 }
      );
    }

    const { error, count } = await query;

    if (error) {
      console.error('Failed to clear rate limit:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to clear rate limit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${count || 0} failed login attempts`,
      clearedCount: count
    });

  } catch (error) {
    console.error('Clear rate limit error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/clear-rate-limit - Check current rate limit status
 */
export async function GET(request: NextRequest) {
  try {
    const secretKey = request.headers.get('x-secret-key');
    const expectedKey = process.env.RATE_LIMIT_CLEAR_KEY || process.env.OTP_TEST_MODE_KEY;
    
    if (!expectedKey || secretKey !== expectedKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ipAddress = searchParams.get('ipAddress');
    const employeeId = searchParams.get('employeeId');

    if (!ipAddress && !employeeId) {
      return NextResponse.json(
        { success: false, message: 'Provide ipAddress or employeeId parameter' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const timeWindow = new Date(Date.now() - AUTH_CONFIG.RATE_LIMITS.TIME_WINDOW);

    let query = supabase
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('success', false)
      .gte('created_at', timeWindow.toISOString());

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to check rate limit:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to check rate limit' },
        { status: 500 }
      );
    }

    const remainingAttempts = AUTH_CONFIG.RATE_LIMITS.LOGIN_ATTEMPTS - (count || 0);
    const isBlocked = remainingAttempts <= 0;

    return NextResponse.json({
      success: true,
      failedAttempts: count || 0,
      maxAttempts: AUTH_CONFIG.RATE_LIMITS.LOGIN_ATTEMPTS,
      remainingAttempts: Math.max(0, remainingAttempts),
      isBlocked,
      timeWindowMinutes: AUTH_CONFIG.RATE_LIMITS.TIME_WINDOW / (60 * 1000),
      attempts: data || []
    });

  } catch (error) {
    console.error('Check rate limit error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
