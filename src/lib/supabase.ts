import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-my-custom-header': 'coal-india-directory'
    }
  }
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey, supabaseOptions)

// Export createClient function for API routes
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseKey, supabaseOptions)

// Types for our employee data
export interface Employee {
  id: number
  emp_code: string
  name: string
  father_name?: string
  designation?: string
  dept?: string
  sub_dept?: string
  area_name?: string
  unit_name?: string
  unit_code?: string
  dept_code?: string
  email_id?: string
  phone_1?: string
  phone_2?: string
  phoneNumber1?: string
  phoneNumber2?: string
  grade?: string
  category?: string
  gender?: string
  blood_group?: string
  dob?: string
  date_of_birth?: string
  // Fixed field names to match database schema
  dt_appt?: string // Date of Appointment
  company_posting_date?: string // Date of Joining
  incr_date?: string // Last Increment Date
  grade_joining_date?: string // Last Promotion Date
  area_joining_date?: string // Area Joining Date
  expected_exit_date?: string // Expected Exit Date
  permanent_address?: string
  present_address?: string
  profile_image?: string
  caste_code?: string // Caste
  religion_code?: string // Religion
  marital_status_code?: string // Marital Status
  spouse_name?: string
  spouse_emp_code?: string
  bank_acc_no?: string // Bank Account Number
  bank?: string // Bank Name
  basic_salary?: number
  hra?: number
  ncwa_basic?: number
  aadhaar_no?: string
  pan_no?: string
  discipline?: string
  pay_flag?: string
  is_active: boolean
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: number
  dept_code: string
  name: string
  description?: string
  is_active: boolean
}

export interface Area {
  id: number
  unit_code: string
  area_name: string
  unit_name: string
  is_active: boolean
}

export interface Designation {
  id: number
  title: string
  grade?: string
  category?: string
  discipline?: string
  is_active: boolean
}
