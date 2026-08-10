'use client'
import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface Props {
  fileUrl: string
  bookId: string
  userId: string
  onPageChange?: (page: number) => void
}

export default function PDFViewer({ fileUrl, bookId, userId, onPageChange }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedText, setSelectedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const changePage = (newPage: number) => {
    const p = Math.min(Math.max(1, newPage), numPages)
    setCurrentPage(p)
    onPageChange?.(p)
    // Guardar progreso de lectura
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('reading_progress').upsert({
        book_id: bookId, student_id: userId,
        last_page: p, updated_at: new Date().toISOString()
      }, { onConflict: 'book_id,student_id' })
    })
  }

  const handleTextSelection = () => {
    const sel = window.getSelection()?.toString().trim()
    if (sel) setSelectedText(sel)
  }

  const saveAnnotation = async () => {
    if (!selectedText) return
    setSaving(true)
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('annotations').insert({
      book_id: bookId, user_id: userId,
      page_number: currentPage, highlight_text: selectedText, color: 'yellow'
    })
    setSaving(false)
    setSelectedText('')
    setSavedMsg('✅ Anotación guardada')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Toolbar */}
      <div className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-300">Página {currentPage} / {numPages}</span>
        <div className="flex gap-2">
          <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}
            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm disabled:opacity-40">← Anterior</button>
          <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= numPages}
            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm disabled:opacity-40">Siguiente →</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Ir a:</span>
          <input type="number" min={1} max={numPages} value={currentPage}
            onChange={e => changePage(parseInt(e.target.value))}
            className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm" />
        </div>
        {selectedText && (
          <button onClick={saveAnnotation} disabled={saving}
            className="ml-auto bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm font-semibold">
            {saving ? 'Guardando...' : '💾 Guardar selección'}
          </button>
        )}
        {savedMsg && <span className="text-green-400 text-sm">{savedMsg}</span>}
      </div>

      {/* Progreso */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full transition-all"
          style={{ width: `${numPages ? (currentPage / numPages) * 100 : 0}%` }} />
      </div>

      {/* PDF */}
      <div onMouseUp={handleTextSelection} className="shadow-xl border rounded-lg overflow-hidden">
        <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="w-[750px] h-[500px] flex items-center justify-center text-gray-400">Cargando PDF...</div>}
          error={<div className="w-[750px] h-[200px] flex items-center justify-center text-red-500">Error al cargar el PDF</div>}>
          <Page pageNumber={currentPage} width={750} />
        </Document>
      </div>
    </div>
  )
}
