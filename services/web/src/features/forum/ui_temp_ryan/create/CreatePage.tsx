'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Send,
} from 'lucide-react'

import { createProjectPost } from '@/features/forum/api/post'
import ForumTrailButtons from '@/features/forum/ui/shared/ForumTrailButtons'

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
  projectSlug: string
  projectDescription: string
}

function BlinkingText({ text, className }: { text: string; className?: string }) {
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`inline-block whitespace-pre-wrap tracking-tight ${className ?? ''}`}>
      <span className="inline">{text}</span>
      <span className={`ml-1 inline-block ${showCursor ? 'opacity-100' : 'opacity-0'}`}>_</span>
    </div>
  )
}

export default function CreatePage({ projectId, projectName, projectSlug, projectDescription }: CreatePageProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <div className="flex min-h-full flex-col font-sans">
      <div className="sticky top-16 z-50">
        <div className="card card-border shadow-xl w-full max-w-full rounded-none sm:rounded-box backdrop-blur-sm">
          <div className="card-body px-4 sm:px-6 py-4 sm:py-5 min-h-0 sm:min-h-[13rem] overflow-hidden">
            <div className="grid h-full grid-cols-1 gap-4">
              <div className="min-w-0">
                <BlinkingText
                  className="text-2xl sm:text-5xl leading-tight text-slate-800 font-interface tracking-wide uppercase break-words line-clamp-2 sm:line-clamp-none"
                  text={projectName}
                />

                <div className="mt-2 sm:mt-3">
                  <BlinkingText
                    className="text-xs sm:text-base leading-snug font-interface break-words line-clamp-2 sm:line-clamp-none"
                    text={projectDescription || 'Share a question, project, or idea with the 42 community.'}
                  />
                </div>
                <div className="mt-10 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-s text-amber-700 leading-relaxed">
                    Posts that violate community rules may be removed without notice. Be kind and stay on topic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 pt-15">
        <ForumTrailButtons
          className="mb-0"
          items={[
            { label: 'Projects', href: '/projects' },
            { label: projectSlug, href: `/projects/${projectId}` },
            { label: 'Create post' },
          ]}
        />
      </div>

      <div className="w-full max-w-6xl mt-1 mx-auto h-full flex">
        {/* Main content */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-col flex-1 pb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 mt-6 p-6 space-y-5 mb-10">
                {/* Project row */}
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-[#8EE7E3] bg-[#8EE7E3]/15 px-4 py-2 text-sm font-semibold text-[#0f6f6b]">
                    Post Creation
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
                    <textarea
                      rows={8}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Explain your idea, include details and context."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition resize-none"
                    />
                </div>
                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
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
          <div className="bg-[#d56610] rounded-2xl p-5 text-white">
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
        </div>
      </div>
    </div>
  )
}
