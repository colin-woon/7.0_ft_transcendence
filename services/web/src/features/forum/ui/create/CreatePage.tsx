'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Type, Link2, ImageIcon,
  AlertCircle, Eye, EyeOff, Send,
} from 'lucide-react'

import { createProjectPost } from '@/features/forum/api/post'

// ── Types ──────────────────────────────────────────────────────────────────────

type PostType = 'text' | 'link' | 'image'

const RULES = [
  'Be respectful and constructive.',
  'No spam or self-promotion.',
  'Use descriptive titles.',
  'Posts created here belong to this project.',
  'Include error output when asking for help.',
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypeTab({
  active, icon: Icon, label, onClick,
}: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? 'border-[#0f6f6b] text-[#0f6f6b]'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface CreatePageProps {
  projectId: number
  projectName: string
}

export default function CreatePage({ projectId, projectName }: CreatePageProps) {
  const router = useRouter()
  const [postType, setPostType] = useState<PostType>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TITLE_MAX = 300

  const canSubmit = !isSubmitting && title.trim().length > 0 && (
    postType === 'text' ? body.trim().length > 0
    : postType === 'link' ? url.trim().length > 0
    : true
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: title,
        content: postType === 'text' ? body : url // Backend expects title/content
      }

      const newPost = await createProjectPost(projectId, payload)
      router.push(`/posts/${newPost.id}`)
    } catch (error) {
      console.error('Error creating post:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Create a post in {projectName}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Share a question, project, or idea with the 42 community.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-6 items-start">

        {/* ── Editor card ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Type tabs */}
          <div className="flex border-b border-gray-100 px-1">
            <TypeTab active={postType === 'text'}  icon={Type}       label="Text"  onClick={() => setPostType('text')} />
            <TypeTab active={postType === 'link'}  icon={Link2}      label="Link"  onClick={() => setPostType('link')} />
            <TypeTab active={postType === 'image'} icon={ImageIcon}  label="Image" onClick={() => setPostType('image')} />
          </div>

          <div className="p-6 space-y-5">

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

            {/* Body — text */}
            {postType === 'text' && (
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
            )}

            {/* URL — link */}
            {postType === 'link' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Image drop zone */}
            {postType === 'image' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-14 transition ${
                    dragOver ? 'border-[#0f6f6b] bg-[#8EE7E3]/10' : 'border-gray-200 hover:border-[#8EE7E3]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#8EE7E3]/20 flex items-center justify-center">
                    <ImageIcon size={22} className="text-[#0f6f6b]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Drop an image here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse · PNG, JPG, GIF up to 20 MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition ${
                  canSubmit
                    ? 'bg-[#0f6f6b] text-white hover:bg-[#0a5a56] shadow-md shadow-[#0f6f6b]/25 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Send size={15} />
                )}
                {isSubmitting ? 'Publishing...' : 'Publish post'}
              </button>
            </div>

          </div>
        </div>

        {/* ── Sidebar card ─────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">

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
      </form>
    </div>
  )
}
