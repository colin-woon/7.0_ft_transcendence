'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ImageIcon,
  AlertCircle, Eye, EyeOff, Send,
} from 'lucide-react'

import { createProjectPost } from '@/features/forum/api/post'

// ── Types ──────────────────────────────────────────────────────────────────────



const RULES = [
  'Be respectful and constructive.',
  'No spam or self-promotion.',
  'Use descriptive titles.',
  'Posts created here belong to this project.',
  'Include error output when asking for help.',
]

// ── Page ───────────────────────────────────────────────────────────────────────

interface CreatePageProps {
  projectId: number
  projectName: string
}

export default function CreatePage({ projectId, projectName }: CreatePageProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TITLE_MAX = 300

  const canSubmit = !isSubmitting && title.trim().length > 0 && body.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {

      const payload = {
        title: title,
        content: body // Backend expects title/content
      }

      const newPost = await createProjectPost(projectId, payload)
      router.push(`posts/${newPost.id}`)
    } catch (error) {
      console.error('Error creating post:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-10 h-[calc(100vh-var(--navbar-height))] overflow-y-auto">
      <div className="max-w-6xl mx-auto h-full flex">
        {/* Main content */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-col flex-1 pb-8">
            <div className="mb-5 px-4 pt-6">
              <h1 className="text-2xl font-bold text-slate-900">Create a post in {projectName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">Share a question, project, or idea with the 42 community.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 p-6 space-y-5 mb-10">
                {/* Project row */}
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-[#8EE7E3] bg-[#8EE7E3]/15 px-4 py-2 text-sm font-semibold text-[#0f6f6b]">
                    Project: {projectName}
                  </div>
                </div>
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-700">Title <span className="text-red-400">*</span></label>
                    <span className={`text-xs ${title.length > TITLE_MAX * 0.9 ? 'text-orange-400' : 'text-slate-300'}`}>
                      {title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a clear, descriptive title"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition"
                  />
                </div>
                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-700">Body <span className="text-red-400">*</span></label>
                    <button
                      type="button"
                      onClick={() => setPreview((v) => !v)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
                    >
                      {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                      {preview ? 'Edit' : 'Preview'}
                    </button>
                  </div>
                  {preview ? (
                    <div className="min-h-[180px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {body || <span className="text-slate-400 italic">Nothing to preview yet.</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Explain your idea, include details and context. Markdown coming soon."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition resize-none"
                    />
                  )}
                </div>
                {/* Image attach bar */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-50 transition">
                    <ImageIcon className="text-[#0f6f6b] h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    <span className="text-xs sm:text-sm text-slate-700">Attach image</span>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" />
                  </label>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-full px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-semibold text-slate-500 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm font-bold transition ${
                      canSubmit
                        ? 'bg-[#0f6f6b] text-white hover:bg-[#0a5a56] shadow-md shadow-[#0f6f6b]/25 active:scale-[0.98]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" />
                    )}
                    {isSubmitting ? 'Publishing...' : 'Publish post'}
                  </button>
                </div>
            </div>
          </div>
        </form>
        {/* Sidebar card */}
        <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0 py-6 pr-4">
          {/* Tips */}
          <div className="bg-gradient-to-br from-[#0f6f6b] to-[#1a9e99] rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Posting tips</p>
            <ul className="space-y-2">
              {RULES.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm opacity-90">
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Posts that violate community rules may be removed without notice. Be kind and stay on topic.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
