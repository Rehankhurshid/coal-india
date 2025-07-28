import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const isAdmin = await AdminService.isUserAdmin(authenticatedUser.employeeId);

    return NextResponse.json({ 
      isAdmin, 
      empCode: authenticatedUser.employeeId 
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
