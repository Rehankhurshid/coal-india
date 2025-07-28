import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/supabase';
import type { LoginLog, CSVUploadResult, EmployeeCSVRow } from '@/types/admin';

export class AdminService {
  // Check if current user is admin
  static async isUserAdmin(empCode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('emp_code', empCode)
      .single();

    if (error || !data) return false;
    return data.is_admin === true;
  }

  // Get all login logs
  static async getLoginLogs(
    page: number = 1,
    limit: number = 50,
    empCode?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ logs: LoginLog[]; total: number }> {
    let query = supabase
      .from('login_logs')
      .select('*', { count: 'exact' });

    if (empCode) {
      query = query.eq('emp_code', empCode);
    }

    if (startDate) {
      query = query.gte('login_time', startDate);
    }

    if (endDate) {
      query = query.lte('login_time', endDate);
    }

    const { data, error, count } = await query
      .order('login_time', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  // Log user login
  static async logUserLogin(
    empCode: string,
    employeeName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('login_logs')
      .insert({
        emp_code: empCode,
        employee_name: employeeName,
        ip_address: ipAddress,
        user_agent: userAgent,
        login_method: 'OTP',
      });

    if (error) console.error('Failed to log login:', error);
  }

  // Get all employees with admin status
  static async getAllEmployees(
    page: number = 1,
    limit: number = 50,
    search?: string,
    filters?: {
      dept?: string;
      area_name?: string;
      is_admin?: boolean;
      is_active?: boolean;
    }
  ): Promise<{ employees: Employee[]; total: number }> {
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,emp_code.ilike.%${search}%,email_id.ilike.%${search}%`);
    }

    if (filters?.dept) {
      query = query.eq('dept', filters.dept);
    }

    if (filters?.area_name) {
      query = query.eq('area_name', filters.area_name);
    }

    if (filters?.is_admin !== undefined) {
      query = query.eq('is_admin', filters.is_admin);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error, count } = await query
      .order('emp_code', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      employees: data || [],
      total: count || 0,
    };
  }

  // Update employee
  static async updateEmployee(
    empCode: string,
    updates: Partial<Employee>
  ): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('emp_code', empCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new employee
  static async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete employee (soft delete)
  static async deleteEmployee(empCode: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('emp_code', empCode);

    if (error) throw error;
  }

  // Toggle admin status
  static async toggleAdminStatus(empCode: string): Promise<Employee> {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('emp_code', empCode)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const { data, error } = await supabase
      .from('employees')
      .update({ is_admin: !current.is_admin })
      .eq('emp_code', empCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Bulk upload employees from CSV
  static async bulkUploadEmployees(
    employees: EmployeeCSVRow[]
  ): Promise<CSVUploadResult> {
    const result: CSVUploadResult = {
      success: true,
      totalRows: employees.length,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
    };

    for (let i = 0; i < employees.length; i++) {
      try {
        const employee = employees[i];
        
        // Check if employee already exists
        const { data: existing } = await supabase
          .from('employees')
          .select('emp_code')
          .eq('emp_code', employee.emp_code)
          .single();

        if (existing) {
          // Update existing employee
          await supabase
            .from('employees')
            .update(employee)
            .eq('emp_code', employee.emp_code);
        } else {
          // Insert new employee
          await supabase
            .from('employees')
            .insert({ ...employee, is_active: true });
        }

        result.successfulRows++;
      } catch (error) {
        result.failedRows++;
        result.errors?.push({
          row: i + 2, // +2 because Excel rows start at 1 and we have header
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.failedRows === 0;
    return result;
  }

  // Generate CSV template
  static generateCSVTemplate(): string {
    const headers = [
      'emp_code',
      'name',
      'father_name',
      'designation',
      'dept',
      'sub_dept',
      'area_name',
      'unit_name',
      'unit_code',
      'dept_code',
      'email_id',
      'phone_1',
      'phone_2',
      'grade',
      'category',
      'gender',
      'blood_group',
      'dob',
      'permanent_address',
      'present_address',
      'bank_acc_no',
      'bank',
      'aadhaar_no',
      'pan_no',
    ];

    const sampleData = [
      'EMP001',
      'John Doe',
      'Father Name',
      'Manager',
      'HR',
      'Recruitment',
      'Head Office',
      'Unit 1',
      'U001',
      'HR001',
      'john.doe@company.com',
      '9876543210',
      '9876543211',
      'E7',
      'Executive',
      'Male',
      'O+',
      '1990-01-01',
      '123 Main St, City',
      '456 Current St, City',
      '1234567890',
      'State Bank',
      '123456789012',
      'ABCDE1234F',
    ];

    return `${headers.join(',')}\n${sampleData.join(',')}`;
  }
}
