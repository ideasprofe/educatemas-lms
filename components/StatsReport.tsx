'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StatsReport({ courseId, schoolId }: { courseId?: string; schoolId?: string }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Estadísticas generales del curso
      if (courseId) {
        const [{ data: enrollments }, { data: grades }, { data: progress }, { data: quizzes }] = await Promise.all([
          supabase.from('enrollments').select('student_id', { count: 'exact' }).eq('course_id', courseId),
          supabase.from('grades').select('score, status').eq('course_id', courseId).eq('status', 'published'),
          supabase.from('reading_progress').select('last_page, total_pages_read, time_spent_minutes'),
          supabase.from('quiz_responses').select('is_correct')
        ])

        const scores = (grades || []).map(g => g.score).filter(Boolean)
        const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A'
        const quizCorrect = (quizzes || []).filter(q => q.is_correct).length
        const quizTotal = (quizzes || []).length

        setStats({
          totalStudents: enrollments?.length || 0,
          avgScore,
          passRate: scores.length ? `${((scores.filter(s => s >= 60).length / scores.length) * 100).toFixed(0)}%` : 'N/A',
          avgTime: progress?.length ? Math.round((progress.reduce((a, b) => a + (b.time_spent_minutes || 0), 0)) / progress.length) : 0,
          quizAccuracy: quizTotal ? `${((quizCorrect / quizTotal) * 100).toFixed(0)}%` : 'N/A',
          atRisk: scores.filter(s => s < 60).length,
        })
      }
      setLoading(false)
    }
    load()
  }, [courseId, schoolId])

  if (loading) return <div className="text-gray-400 text-sm animate-pulse">Cargando estadísticas...</div>
  if (!stats) return null

  const cards = [
    { label: 'Alumnos matriculados', value: stats.totalStudents, icon: '👥', color: 'bg-blue-50 border-blue-200' },
    { label: 'Promedio del grupo', value: stats.avgScore, icon: '📊', color: 'bg-green-50 border-green-200' },
    { label: 'Tasa de aprobación', value: stats.passRate, icon: '✅', color: 'bg-emerald-50 border-emerald-200' },
    { label: 'Tiempo promedio (min)', value: stats.avgTime, icon: '⏱️', color: 'bg-purple-50 border-purple-200' },
    { label: 'Precisión en quizzes', value: stats.quizAccuracy, icon: '🎯', color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Alumnos en riesgo', value: stats.atRisk, icon: '⚠️', color: 'bg-red-50 border-red-200' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-lg">📈 Estadísticas del curso</h3>
        <button onClick={() => window.print()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          🖨️ Exportar reporte
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.color}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-600 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {stats.atRisk > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">Alumnos en riesgo de reprobación</p>
            <p className="text-red-700 text-xs mt-1">
              {stats.atRisk} alumno{stats.atRisk > 1 ? 's tienen' : ' tiene'} calificación menor a 60.
              Se recomienda intervención del profesor.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
