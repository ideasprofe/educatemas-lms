'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function QuizPopup({ bookId, currentPage, userId }: { bookId: string; currentPage: number; userId: string }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: q } = await supabase.from('quizzes').select('*').eq('book_id', bookId).eq('page_number', currentPage).single()
      if (!q) { setQuiz(null); return }
      // Verificar si ya respondió
      const { data: resp } = await supabase.from('quiz_responses').select('id').eq('quiz_id', q.id).eq('student_id', userId).single()
      setAlreadyAnswered(!!resp)
      setQuiz(q)
      setSelected(null)
      setSubmitted(!!resp)
    }
    fetch()
  }, [currentPage, bookId, userId])

  const submit = async () => {
    if (selected === null || !quiz) return
    const isCorrect = selected === quiz.correct_option
    await supabase.from('quiz_responses').insert({ quiz_id: quiz.id, student_id: userId, selected_option: selected, is_correct: isCorrect })
    setSubmitted(true)
  }

  if (!quiz) return null
  const options = quiz.options as string[]

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📝</span>
        <span className="font-semibold text-blue-900 text-sm">Pregunta de comprensión — Página {currentPage}</span>
      </div>
      <p className="text-gray-800 font-medium mb-4 text-sm">{quiz.question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button key={i} onClick={() => !submitted && setSelected(i)}
            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
              submitted
                ? i === quiz.correct_option ? 'bg-green-100 border-green-500 text-green-800 font-semibold'
                  : selected === i ? 'bg-red-100 border-red-400 text-red-800' : 'bg-white border-gray-200 text-gray-500'
                : selected === i ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            }`}>
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button onClick={submit} disabled={selected === null}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
          Responder
        </button>
      ) : (
        <div className={`mt-4 p-3 rounded-lg text-sm ${selected === quiz.correct_option ? 'bg-green-100 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
          {selected === quiz.correct_option ? '✅ ¡Correcto!' : `❌ La respuesta correcta era: ${options[quiz.correct_option]}`}
          {quiz.explanation && <p className="mt-1 text-xs opacity-80">{quiz.explanation}</p>}
        </div>
      )}
    </div>
  )
}
