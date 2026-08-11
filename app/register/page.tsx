'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">YachanaHub</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu nombre" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="tu@correo.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="..." required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soy...</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="student">Alumno</option>
              <option value="teacher">Profesor</option>
              <option value="parent">Padre / Tutor</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Ya tienes cuenta? <a href="/login" className="text-blue-600 font-medium hover:underline">Iniciar sesion</a>
        </p>
      </div>
    </div>
  )
}
