import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our employee data
export interface Employee {
  id: number
  emp_code: string
  name: string
  father_name?: string
  designation?: string
  dept?: string
  area_name?: string
  unit_name?: string
  email_id?: string
  phone_1?: string
  phone_2?: string
  grade?: string
  category?: string
  gender?: string
  blood_group?: string
  dob?: string
  permanent_address?: string
  present_address?: string
  is_active: boolean
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
