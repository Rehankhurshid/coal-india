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

    const csvContent = AdminService.generateCSVTemplate();

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employee_template.csv"',
      },
    });
  } catch (error) {
    console.error('CSV template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
