'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { courseId: string; periodId: string; userId: string; userRole: string }

export default function GradeManager({ courseId, periodId, userId, userRole }: Props) {
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isTeacher = userRole === 'teacher'
  const isDirector = ['school_director', 'school_admin', 'superadmin'].includes(userRole)
  const isStudent = userRole === 'student'

  useEffect(() => {
    const load = async () => {
      if (isTeacher || isDirector) {
        // Cargar todos los alumnos del curso
        const { data: enroll } = await supabase.from('enrollments')
          .select('student_id, profiles(id, full_name)').eq('course_id', courseId)
        setStudents((enroll || []).map((e: any) => e.profiles))

        // Cargar calificaciones existentes
        const { data: g } = await supabase.from('grades').select('*')
          .eq('course_id', courseId).eq('period_id', periodId)
        setGrades(g || [])
      } else if (isStudent) {
        // Solo ver las propias (publicadas)
        const { data: g } = await supabase.from('grades').select('*')
          .eq('course_id', courseId).eq('student_id', userId).eq('status', 'published')
        setGrades(g || [])
      }
      setLoading(false)
    }
    load()
  }, [courseId, periodId, userId, userRole, isTeacher, isDirector, isStudent])

  const upsertGrade = async (studentId: string, score: number) => {
    const existing = grades.find(g => g.student_id === studentId)
    if (existing) {
      await supabase.from('grades').update({ score, status: 'draft' }).eq('id', existing.id)
    } else {
      await supabase.from('grades').insert({ student_id: studentId, course_id: courseId, period_id: periodId, teacher_id: userId, score, status: 'draft' })
    }
    setGrades(prev => {
      const idx = prev.findIndex(g => g.student_id === studentId)
      const updated = { student_id: studentId, score, status: 'draft' }
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], ...updated }; return copy }
      return [...prev, updated]
    })
  }

  const submitForApproval = async () => {
    const draftIds = grades.filter(g => g.status === 'draft').map(g => g.id)
    if (draftIds.length === 0) return
    await supabase.from('grades').update({ status: 'pending' }).in('id', draftIds)
    setGrades(prev => prev.map(g => draftIds.includes(g.id) ? { ...g, status: 'pending' } : g))
    alert('✅ Calificaciones enviadas a la dirección para aprobación')
  }

  const approveAll = async () => {
    const pendingIds = grades.filter(g => g.status === 'pending').map(g => g.id)
    await supabase.from('grades').update({ status: 'published', approved_by: userId, approved_at: new Date().toISOString() }).in('id', pendingIds)
    setGrades(prev => prev.map(g => pendingIds.includes(g.id) ? { ...g, status: 'published' } : g))
    alert('✅ Calificaciones aprobadas y publicadas para los alumnos')
  }

  const rejectAll = async (reason: string) => {
    const pendingIds = grades.filter(g => g.status === 'pending').map(g => g.id)
    await supabase.from('grades').update({ status: 'rejected', rejection_reason: reason }).in('id', pendingIds)
    setGrades(prev => prev.map(g => pendingIds.includes(g.id) ? { ...g, status: 'rejected' } : g))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600', pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700', published: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = { draft: 'Borrador', pending: 'En revisión', approved: 'Aprobada', published: 'Publicada', rejected: 'Rechazada' }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || ''}`}>{labels[status] || status}</span>
  }

  if (loading) return <div className="text-gray-400 text-sm">Cargando calificaciones...</div>

  // Vista alumno
  if (isStudent) return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-bold text-gray-900 mb-4">🏆 Mis calificaciones</h3>
      {grades.length === 0 ? (
        <p className="text-gray-400 text-sm">Las calificaciones aún no han sido publicadas</p>
      ) : (
        <div className="space-y-2">
          {grades.map(g => (
            <div key={g.id} className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-gray-700">Calificación</span>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${g.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>{g.score}</span>
                {statusBadge(g.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Vista profesor
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">📋 Calificaciones del período</h3>
        <div className="flex gap-2">
          {isTeacher && grades.some(g => g.status === 'draft') && (
            <button onClick={submitForApproval}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Enviar a dirección
            </button>
          )}
          {isDirector && grades.some(g => g.status === 'pending') && (
            <>
              <button onClick={approveAll}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                ✅ Aprobar y publicar
              </button>
              <button onClick={() => { const r = prompt('Razón del rechazo:'); if (r) rejectAll(r) }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                ❌ Rechazar
              </button>
            </>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-left">
            <th className="px-3 py-2 rounded-l-lg">Alumno</th>
            <th className="px-3 py-2">Nota (0–100)</th>
            <th className="px-3 py-2 rounded-r-lg">Estado</th>
          </tr>
        </thead>
        <tbody>
          {students.map(st => {
            const g = grades.find(gr => gr.student_id === st.id)
            return (
              <tr key={st.id} className="border-b last:border-0">
                <td className="px-3 py-3 font-medium text-gray-800">{st.full_name}</td>
                <td className="px-3 py-3">
                  {isTeacher && (!g || g.status === 'draft' || g.status === 'rejected') ? (
                    <input type="number" min={0} max={100} defaultValue={g?.score || ''}
                      onBlur={e => upsertGrade(st.id, parseFloat(e.target.value))}
                      className="w-20 border rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <span className={`font-bold ${(g?.score || 0) >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                      {g?.score ?? '—'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">{g ? statusBadge(g.status) : <span className="text-gray-300 text-xs">Sin nota</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
