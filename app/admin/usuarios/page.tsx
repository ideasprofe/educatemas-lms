'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile, UserRole } from '@/lib/supabase'

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [actualizando, setActualizando] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!perfil || !['superadmin', 'publisher_admin', 'school_admin'].includes(perfil.role)) {
        router.push('/dashboard')
        return
      }

      cargarUsuarios()
    }
    init()
  }, [router])

  const cargarUsuarios = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) { setError('Error al cargar usuarios'); setLoading(false); return }
    setUsuarios(data || [])
    setLoading(false)
  }

  const cambiarRol = async (id: string, nuevoRol: UserRole) => {
    setActualizando(id)
    const { error } = await supabase
      .from('profiles')
      .update({ role: nuevoRol })
      .eq('id', id)

    if (error) {
      alert('Error al cambiar el rol')
    } else {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role: nuevoRol } : u))
    }
    setActualizando(null)
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.full_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const etiquetaRol: Record<UserRole, string> = {
    superadmin: 'Superadmin',
    publisher_admin: 'Editor',
    school_director: 'Director',
    school_admin: 'Admin Escuela',
    teacher: 'Instructor',
    student: 'Estudiante',
    parent: 'Padre/Madre',
  }

  const colorRol: Record<UserRole, string> = {
    superadmin: 'bg-purple-100 text-purple-800',
    publisher_admin: 'bg-blue-100 text-blue-800',
    school_director: 'bg-indigo-100 text-indigo-800',
    school_admin: 'bg-cyan-100 text-cyan-800',
    teacher: 'bg-green-100 text-green-800',
    student: 'bg-gray-100 text-gray-700',
    parent: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Gestión de usuarios — YachanaHub</p>
        </div>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">← Volver al dashboard</a>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Buscador */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-4 text-sm text-gray-500">{usuariosFiltrados.length} usuario(s)</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando usuarios...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold">Correo</th>
                  <th className="text-left px-4 py-3 font-semibold">Rol actual</th>
                  <th className="text-left px-4 py-3 font-semibold">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin resultados</td></tr>
                ) : (
                  usuariosFiltrados.map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorRol[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {etiquetaRol[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={actualizando === u.id}
                          onChange={e => cambiarRol(u.id, e.target.value as UserRole)}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {(Object.keys(etiquetaRol) as UserRole[]).map(r => (
                            <option key={r} value={r}>{etiquetaRol[r]}</option>
                          ))}
                        </select>
                        {actualizando === u.id && <span className="ml-2 text-xs text-gray-400">Guardando...</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
