import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import type { EmployeeCSVRow } from '@/types/admin';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'CSV file must contain headers and at least one data row' 
      }, { status: 400 });
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim());
    const employees: EmployeeCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const employee: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== '') {
          employee[header] = value;
        }
      });

      if (employee.emp_code) {
        employees.push(employee as EmployeeCSVRow);
      }
    }

    if (employees.length === 0) {
      return NextResponse.json({ 
        error: 'No valid employee records found in CSV' 
      }, { status: 400 });
    }

    const result = await AdminService.bulkUploadEmployees(employees);

    return NextResponse.json(result);
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
