import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await AdminService.isUserAdmin(authenticatedUser.employeeId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const empCode = searchParams.get('emp_code') || undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    const result = await AdminService.getLoginLogs(page, limit, empCode, startDate, endDate);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Login logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
