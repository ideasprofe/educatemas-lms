'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      // Cargar cursos según el rol
      if (prof?.role === 'teacher') {
        const { data } = await supabase.from('courses').select('*, schools(name)').eq('teacher_id', user.id)
        setCourses(data || [])
      } else if (prof?.role === 'student') {
        const { data } = await supabase.from('enrollments')
          .select('courses(*, schools(name))').eq('student_id', user.id)
        setCourses((data || []).map((e: any) => e.courses))
      } else if (['school_director', 'school_admin'].includes(prof?.role || '')) {
        const { data } = await supabase.from('courses').select('*, profiles(full_name)').eq('school_id', prof?.school_id)
        setCourses(data || [])
      }

      // Notificaciones no leídas
      const { data: notifs } = await supabase.from('notifications')
        .select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(5)
      setNotifications(notifs || [])
      setLoading(false)
    }
    loadData()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Cargando...</div>
    </div>
  )

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin', publisher_admin: 'Editorial',
    school_director: 'Director', school_admin: 'Admin Escolar',
    teacher: 'Profesor', student: 'Alumno', parent: 'Padre/Tutor'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-gray-900">EduSaaS</span>
        </div>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <div className="relative">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-600">{profile?.full_name}</span>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
            {roleLabels[profile?.role || 'student']}
          </span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Salir</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mb-8">
          {profile?.role === 'student' ? 'Aquí están tus cursos activos' :
           profile?.role === 'teacher' ? 'Aquí están tus cursos asignados' :
           'Panel de administración'}
        </p>

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
                <span>🔔</span> {n.message}
              </div>
            ))}
          </div>
        )}

        {/* Grid de cursos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id}
              onClick={() => router.push(`/courses/${course.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                <span className="text-white font-bold">{course.title?.[0]}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{course.subject || 'Sin materia asignada'}</p>
              {course.schools && (
                <p className="text-xs text-gray-400 mt-2">{course.schools.name}</p>
              )}
              {course.profiles && (
                <p className="text-xs text-gray-400 mt-2">Prof: {course.profiles.full_name}</p>
              )}
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📚</div>
              <p>No hay cursos disponibles aún</p>
            </div>
          )}
        </div>

        {/* Botón crear curso (solo profesores y directores) */}
        {['teacher', 'school_director', 'school_admin'].includes(profile?.role || '') && (
          <div className="mt-8">
            <button
              onClick={() => router.push('/courses/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              + Crear nuevo curso
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
