'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Publisher = {
  id: string
  name: string
  created_at: string
}

export default function EditorialesPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAccess()
    loadPublishers()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!prof || prof.role !== 'superadmin') {
      router.push('/dashboard')
    }
  }

  const loadPublishers = async () => {
    const { data } = await supabase
      .from('publishers')
      .select('*')
      .order('created_at', { ascending: false })
    setPublishers(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('publishers').insert({ name })
    if (error) { setError(error.message); setSaving(false); return }
    setName('')
    setShowForm(false)
    setSaving(false)
    loadPublishers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta editorial?')) return
    await supabase.from('publishers').delete().eq('id', id)
    loadPublishers()
  }

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
            <h1 className="text-2xl font-bold text-gray-900">{'📚'} Editoriales</h1>
            <p className="text-gray-500 text-sm mt-1">Editoriales registradas en la plataforma</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            + Nueva editorial
          </button>
        </div>

        {/* Formulario nueva editorial */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Crear editorial</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la editorial</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: Editorial Santillana"
                required
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar editorial'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de editoriales */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando editoriales...</div>
        ) : publishers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">{'📚'}</div>
            <p>No hay editoriales registradas</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha registro</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {publishers.map((pub, i) => (
                  <tr key={pub.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-900">{pub.name}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(pub.created_at).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(pub.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
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
