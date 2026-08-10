import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de roles disponibles en la plataforma
export type UserRole =
  | 'superadmin'
  | 'publisher_admin'
  | 'school_director'
  | 'school_admin'
  | 'teacher'
  | 'student'
  | 'parent'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  school_id?: string
  avatar_url?: string
}

export interface School {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  subdomain?: string
  subscription_status: 'active' | 'inactive' | 'trial'
  subscription_expires_at?: string
}

export interface Publisher {
  id: string
  name: string
  logo_url?: string
  contact_email?: string
}

export interface Book {
  id: string
  course_id?: string
  publisher_id?: string
  title: string
  file_url: string
  total_pages?: number
  subject?: string
  grade_level?: string
  created_at: string
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  period_id: string
  teacher_id: string
  score: number
  notes?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}
