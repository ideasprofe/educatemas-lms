import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Llamar este endpoint después de subir un PDF para procesarlo con IA
// Body: { bookId: string, textChunks: [{ page: number, text: string }] }
export async function POST(req: NextRequest) {
  try {
    const { bookId, textChunks } = await req.json()
    if (!bookId || !textChunks?.length) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

    // Eliminar chunks previos del libro
    await supabase.from('book_chunks').delete().eq('book_id', bookId)

    let processed = 0
    for (const chunk of textChunks) {
      if (!chunk.text?.trim()) continue
      const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: chunk.text.slice(0, 8000) })
      await supabase.from('book_chunks').insert({
        book_id: bookId, page_number: chunk.page,
        content: chunk.text, embedding: embRes.data[0].embedding
      })
      processed++
    }

    return NextResponse.json({ success: true, chunksProcessed: processed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
