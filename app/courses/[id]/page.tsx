'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Forum from '@/components/Forum'
import GradeManager from '@/components/GradeManager'
import StatsReport from '@/components/StatsReport'

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<any>(null)
  const [books, setBooks] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [period, setPeriod] = useState<any>(null)
  const [tab, setTab] = useState<'books' | 'forum' | 'grades' | 'stats'>('books')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: prof }, { data: c }, { data: b }, { data: a }, { data: p }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('courses').select('*, schools(name, logo_url, primary_color), profiles!teacher_id(full_name)').eq('id', id).single(),
        supabase.from('book_licenses').select('books(*)').eq('course_id', id),
        supabase.from('assignments').select('*').eq('course_id', id).order('due_date'),
        supabase.from('academic_periods').select('*').eq('is_active', true).limit(1).single(),
      ])

      setProfile(prof)
      setCourse(c)
      setBooks((b || []).map((bl: any) => bl.books))
      setAssignments(a || [])
      setPeriod(p)
    }
    load()
  }, [id, router])

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Cargando curso...</div>
    </div>
  )

  const tabs = [
    { key: 'books', label: '📚 Libros' },
    { key: 'forum', label: '💬 Foro' },
    { key: 'grades', label: '📋 Calificaciones' },
    ...(['teacher','school_director','school_admin','superadmin'].includes(profile?.role) ? [{ key: 'stats', label: '📈 Estadísticas' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del curso */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600 mb-3 flex items-center gap-1">
            ← Volver al panel
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {course.title?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-sm text-gray-500">
                {course.subject} · {course.grade_level} · Prof. {course.profiles?.full_name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">{course.schools?.name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* TAB: Libros */}
        {tab === 'books' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {books.map(book => (
                <div key={book.id}
                  onClick={() => router.push(`/courses/${id}/books/${book.id}`)}
                  className="bg-white rounded-xl border cursor-pointer hover:shadow-md transition-shadow p-5">
                  <div className="w-10 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-3 text-2xl">📕</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{book.subject} · {book.grade_level}</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Sin progreso aún</p>
                </div>
              ))}
              {books.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-sm">No hay libros asignados a este curso</p>
                </div>
              )}
            </div>

            {/* Tareas */}
            {assignments.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-3">📝 Tareas pendientes</h2>
                <div className="space-y-2">
                  {assignments.map(a => (
                    <div key={a.id} className="bg-white border rounded-xl px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Vence</p>
                        <p className="text-sm font-semibold text-orange-600">
                          {a.due_date ? new Date(a.due_date).toLocaleDateString('es') : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Foro */}
        {tab === 'forum' && profile && (
          <Forum courseId={id} userId={profile.id} />
        )}

        {/* TAB: Calificaciones */}
        {tab === 'grades' && profile && period && (
          <GradeManager courseId={id} periodId={period.id} userId={profile.id} userRole={profile.role} />
        )}

        {/* TAB: Estadísticas */}
        {tab === 'stats' && (
          <StatsReport courseId={id} />
        )}
      </div>
    </div>
  )
}
