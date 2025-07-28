import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ emp_code: string }> }
) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await AdminService.isUserAdmin(authenticatedUser.employeeId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { emp_code } = await params;
    
    // Prevent removing admin status from ADMIN001
    if (emp_code === 'ADMIN001') {
      return NextResponse.json({ 
        error: 'Cannot modify admin status of main administrator' 
      }, { status: 400 });
    }

    const employee = await AdminService.toggleAdminStatus(emp_code);

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Toggle admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
