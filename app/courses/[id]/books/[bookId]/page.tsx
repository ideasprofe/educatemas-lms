'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import AIChat from '@/components/AIChat'
import QuizPopup from '@/components/QuizPopup'

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false })

export default function BookReaderPage() {
  const { id: courseId, bookId } = useParams<{ id: string; bookId: string }>()
  const [book, setBook] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidePanel, setSidePanel] = useState<'chat' | 'annotations' | null>('chat')
  const [annotations, setAnnotations] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: prof }, { data: b }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('books').select('*').eq('id', bookId).single(),
      ])
      setProfile(prof)
      setBook(b)
      // Restaurar progreso de lectura
      const { data: progress } = await supabase.from('reading_progress')
        .select('last_page').eq('book_id', bookId).eq('student_id', user.id).single()
      if (progress?.last_page) setCurrentPage(progress.last_page)
    }
    load()
  }, [bookId, router])

  const loadAnnotations = async () => {
    if (!profile) return
    const { data } = await supabase.from('annotations')
      .select('*').eq('book_id', bookId).eq('user_id', profile.id)
      .order('page_number')
    setAnnotations(data || [])
  }

  const handleSidePanel = (panel: 'chat' | 'annotations') => {
    if (panel === 'annotations') loadAnnotations()
    setSidePanel(sidePanel === panel ? null : panel)
  }

  if (!book || !profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Cargando libro...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.push(`/courses/${courseId}`)} className="text-gray-300 hover:text-white text-sm">
          ← Volver
        </button>
        <span className="font-semibold truncate">{book.title}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => handleSidePanel('chat')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sidePanel === 'chat' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            🤖 Chat IA
          </button>
          <button onClick={() => handleSidePanel('annotations')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sidePanel === 'annotations' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>
            🖊️ Notas
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* PDF principal */}
        <div className={`flex-1 overflow-y-auto p-6 ${sidePanel ? 'max-w-[calc(100%-360px)]' : 'max-w-full'}`}>
          <PDFViewer
            fileUrl={book.file_url}
            bookId={bookId}
            userId={profile.id}
            onPageChange={setCurrentPage}
          />
          {/* Quiz embebido por página */}
          <QuizPopup bookId={bookId} currentPage={currentPage} userId={profile.id} />
        </div>

        {/* Panel lateral */}
        {sidePanel && (
          <div className="w-[360px] bg-white border-l flex flex-col overflow-y-auto">
            {sidePanel === 'chat' && (
              <div className="p-4 flex-1 flex flex-col">
                <AIChat bookId={bookId} />
              </div>
            )}
            {sidePanel === 'annotations' && (
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-4">🖊️ Mis anotaciones</h3>
                {annotations.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    <div className="text-3xl mb-2">🖊️</div>
                    Selecciona texto en el PDF y presiona "Guardar selección"
                  </div>
                ) : (
                  <div className="space-y-3">
                    {annotations.map(a => (
                      <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Página {a.page_number}</p>
                        <p className="text-sm text-gray-800 italic">"{a.highlight_text}"</p>
                        {a.note && <p className="text-xs text-gray-600 mt-1">{a.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
