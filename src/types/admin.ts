export interface LoginLog {
  id: number;
  emp_code: string;
  employee_name?: string;
  login_time: string;
  ip_address?: string;
  user_agent?: string;
  login_method?: string;
  created_at: string;
}

export interface AdminEmployee {
  id: number;
  emp_code: string;
  name: string;
  designation?: string;
  dept?: string;
  area_name?: string;
  email_id?: string;
  phone_1?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CSVUploadResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

// CSV Template structure
export interface EmployeeCSVRow {
  emp_code: string;
  name: string;
  father_name?: string;
  designation?: string;
  dept?: string;
  sub_dept?: string;
  area_name?: string;
  unit_name?: string;
  unit_code?: string;
  dept_code?: string;
  email_id?: string;
  phone_1?: string;
  phone_2?: string;
  grade?: string;
  category?: string;
  gender?: string;
  blood_group?: string;
  dob?: string;
  permanent_address?: string;
  present_address?: string;
  bank_acc_no?: string;
  bank?: string;
  aadhaar_no?: string;
  pan_no?: string;
}
