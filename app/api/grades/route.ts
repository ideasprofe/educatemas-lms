import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: obtener calificaciones de un curso
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const periodId = searchParams.get('periodId')
  if (!courseId) return NextResponse.json({ error: 'courseId requerido' }, { status: 400 })
  const query = supabase.from('grades').select('*, profiles!student_id(full_name)').eq('course_id', courseId)
  if (periodId) query.eq('period_id', periodId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ grades: data })
}

// PATCH: cambiar estado de calificaciones (pending → published / rejected)
export async function PATCH(req: NextRequest) {
  const { gradeIds, status, reason } = await req.json()
  const update: any = { status }
  if (status === 'published') update.approved_at = new Date().toISOString()
  if (reason) update.rejection_reason = reason
  const { error } = await supabase.from('grades').update(update).in('id', gradeIds)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
