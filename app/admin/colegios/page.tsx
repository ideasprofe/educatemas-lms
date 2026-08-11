'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type School = {
  id: string
  name: string
  subscription_status: string
  created_at: string
}

export default function ColegiosPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', subscription_status: 'active' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAccess()
    loadSchools()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!prof || !['superadmin', 'publisher_admin'].includes(prof.role)) {
      router.push('/dashboard')
    }
  }

  const loadSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false })
    setSchools(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('schools').insert({
      name: form.name,
      subscription_status: form.subscription_status,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setForm({ name: '', subscription_status: 'active' })
    setShowForm(false)
    setSaving(false)
    loadSchools()
  }

  const toggleStatus = async (school: School) => {
    const newStatus = school.subscription_status === 'active' ? 'inactive' : 'active'
    await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', school.id)
    loadSchools()
  }

  const statusColor = (status: string) =>
    status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Y</span>
          </div>
          <span className="font-bold text-gray-900">YachanaHub</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
          {'<'} Volver al panel
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{'🏫'} Colegios</h1>
            <p className="text-gray-500 text-sm mt-1">Colegios suscritos a la plataforma</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            + Nuevo colegio
          </button>
        </div>

        {/* Formulario nuevo colegio */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Crear colegio</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del colegio</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ej: Colegio San Andres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={form.subscription_status}
                  onChange={e => setForm({ ...form, subscription_status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="trial">Prueba</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar colegio'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de colegios */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando colegios...</div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">{'🏫'}</div>
            <p>No hay colegios registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha registro</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school, i) => (
                  <tr key={school.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-900">{school.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(school.subscription_status)}`}>
                        {school.subscription_status === 'active' ? 'Activo' :
                         school.subscription_status === 'trial' ? 'Prueba' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(school.created_at).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(school)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {school.subscription_status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
