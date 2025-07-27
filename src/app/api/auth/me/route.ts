import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import { createServerClient } from '@/lib/supabase-server';

interface MeResponse {
  success: boolean;
  employee?: any;
  message: string;
}

/**
 * GET /api/auth/me - Get current authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse<MeResponse>> {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get employee details
    const supabase = createServerClient();
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        emp_code,
        name,
        designation,
        dept,
        sub_dept,
        area_name,
        unit_name,
        email_id,
        phone_1,
        phone_2,
        grade,
        category,
        is_active
      `)
      .eq('emp_code', authenticatedUser.employeeId)
      .eq('is_active', true)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee,
      message: 'User data retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
