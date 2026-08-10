'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Forum({ courseId, userId }: { courseId: string; userId: string }) {
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState<Record<string, any[]>>({})

  const loadPosts = async () => {
    const { data } = await supabase.from('forum_posts')
      .select('*, profiles(full_name, role)').eq('course_id', courseId).is('parent_id', null)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const loadReplies = async (postId: string) => {
    const { data } = await supabase.from('forum_posts')
      .select('*, profiles(full_name, role)').eq('parent_id', postId).order('created_at', { ascending: true })
    setReplies(prev => ({ ...prev, [postId]: data || [] }))
  }

  useEffect(() => { loadPosts() }, [courseId])

  const submitPost = async () => {
    if (!newPost.trim()) return
    await supabase.from('forum_posts').insert({ course_id: courseId, author_id: userId, content: newPost })
    setNewPost('')
    loadPosts()
  }

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return
    await supabase.from('forum_posts').insert({ course_id: courseId, author_id: userId, parent_id: parentId, content: replyText })
    setReplyTo(null)
    setReplyText('')
    loadReplies(parentId)
  }

  const timeAgo = (ts: string) => {
    const d = new Date(ts), now = new Date()
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins} min`
    if (mins < 1440) return `hace ${Math.floor(mins/60)}h`
    return d.toLocaleDateString('es')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">💬 Foro del curso</h2>

      {/* Nueva publicación */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
          placeholder="Haz una pregunta o comparte algo con el grupo..."
          className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
        <div className="flex justify-end mt-2">
          <button onClick={submitPost} disabled={!newPost.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
            Publicar
          </button>
        </div>
      </div>

      {/* Lista de publicaciones */}
      {posts.map(post => (
        <div key={post.id} className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
              {post.profiles?.full_name?.[0] || '?'}
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900">{post.profiles?.full_name || 'Usuario'}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${post.profiles?.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {post.profiles?.role === 'teacher' ? 'Profesor' : 'Alumno'}
              </span>
            </div>
            <span className="ml-auto text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>

          {/* Respuestas */}
          {replies[post.id]?.map(r => (
            <div key={r.id} className="ml-8 mt-3 border-l-2 border-gray-100 pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-700">{r.profiles?.full_name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.profiles?.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.profiles?.role === 'teacher' ? 'Profesor' : 'Alumno'}
                </span>
                <span className="ml-auto text-xs text-gray-400">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-xs text-gray-700">{r.content}</p>
            </div>
          ))}

          <div className="flex gap-3 mt-3">
            <button onClick={() => { setReplyTo(replyTo === post.id ? null : post.id); loadReplies(post.id) }}
              className="text-xs text-blue-600 hover:underline">
              Responder
            </button>
            {!replies[post.id] && (
              <button onClick={() => loadReplies(post.id)} className="text-xs text-gray-400 hover:underline">
                Ver respuestas
              </button>
            )}
          </div>

          {replyTo === post.id && (
            <div className="mt-3 flex gap-2">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitReply(post.id)}
                placeholder="Escribe tu respuesta..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => submitReply(post.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                Enviar
              </button>
            </div>
          )}
        </div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">Sé el primero en publicar algo</p>
        </div>
      )}
    </div>
  )
}
