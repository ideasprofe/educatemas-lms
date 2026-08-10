'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewCoursePage() {
  const [form, setForm] = useState({ title: '', subject: '', grade_level: '', section: '', description: '' })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase.from('courses').insert({
      ...form, teacher_id: profile.id, school_id: profile.school_id
    }).select().single()
    if (error) { alert(error.message); setLoading(false); return }
    router.push(`/courses/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600 mb-6">
          ← Volver al panel
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear nuevo curso</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
          {[
            { key: 'title', label: 'Nombre del curso', placeholder: 'Ej: Matemáticas 6°' },
            { key: 'subject', label: 'Materia', placeholder: 'Ej: Matemáticas' },
            { key: 'grade_level', label: 'Grado', placeholder: 'Ej: 6° Primaria' },
            { key: 'section', label: 'Sección', placeholder: 'Ej: A' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="text" value={(form as any)[f.key]} placeholder={f.placeholder}
                onChange={e => setForm({...form, [f.key]: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3} placeholder="Describe el contenido del curso..." />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear curso'}
          </button>
        </form>
      </div>
    </div>
  )
}
