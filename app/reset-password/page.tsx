'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase injects the session from the URL hash automatically.
    // We listen for the PASSWORD_RECOVERY event to know the token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Also check if there's already an active session (in case listener already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contrase&ntilde;a</h1>
          <p className="text-gray-500 text-sm mt-1">YachanaHub &mdash; Plataforma educativa</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm text-center">
            <div className="text-2xl mb-2">{'✓'}</div>
            <p className="font-semibold">Contrase&ntilde;a actualizada</p>
            <p className="mt-1 text-xs text-green-600">Redirigiendo al panel...</p>
          </div>
        ) : !ready ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">Verificando enlace...</div>
            <div className="mt-4 text-xs text-gray-400">
              Si esto tarda mucho,{' '}
              <button
                onClick={() => setReady(true)}
                className="text-blue-600 hover:underline"
              >
                haz clic aqu&iacute;
              </button>
              {' '}para continuar.
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contrase&ntilde;a
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="M&iacute;nimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contrase&ntilde;a
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la contrase&ntilde;a"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Cambiar contrase&ntilde;a'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:underline"
              >
                Volver al login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
