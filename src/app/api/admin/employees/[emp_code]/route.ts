import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export async function PUT(
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
    const body = await request.json();
    const employee = await AdminService.updateEmployee(emp_code, body);

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    await AdminService.deleteEmployee(emp_code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
