import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' })
  try {
    const { question, bookId } = await req.json()
    if (!question || !bookId) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

    // 1. Convertir la pregunta en vector
    const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: question })
    const embedding = embRes.data[0].embedding

    // 2. Buscar fragmentos más relevantes del libro
    const { data: chunks } = await supabase.rpc('match_book_chunks', {
      query_embedding: embedding, book_id_filter: bookId, match_count: 5
    })

    const context = (chunks || []).map((c: any) => `[Página ${c.page_number}] ${c.content}`).join('\n\n')

    // 3. Generar respuesta con GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Eres un asistente educativo amable. Responde ÚNICAMENTE basándote en el siguiente contenido del libro. Si la pregunta no está relacionada con el libro, dilo claramente.\n\nCONTENIDO DEL LIBRO:\n${context}` },
        { role: 'user', content: question }
      ],
      max_tokens: 500
    })

    return NextResponse.json({ answer: completion.choices[0].message.content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
