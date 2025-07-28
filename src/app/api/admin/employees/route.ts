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
    const search = searchParams.get('search') || undefined;
    const dept = searchParams.get('dept') || undefined;
    const area_name = searchParams.get('area_name') || undefined;
    const is_admin = searchParams.get('is_admin') 
      ? searchParams.get('is_admin') === 'true'
      : undefined;
    const is_active = searchParams.get('is_active') 
      ? searchParams.get('is_active') === 'true'
      : undefined;

    const result = await AdminService.getAllEmployees(page, limit, search, {
      dept,
      area_name,
      is_admin,
      is_active,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await AdminService.isUserAdmin(authenticatedUser.employeeId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const employee = await AdminService.createEmployee({
      ...body,
      is_active: true,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
