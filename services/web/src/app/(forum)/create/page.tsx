'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Type, Link2, ImageIcon, Tag, X, ChevronDown,
  AlertCircle, Eye, EyeOff, Send,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type PostType = 'text' | 'link' | 'image'

const CATEGORIES = ['Discussion', 'Help', 'Show & Tell', 'Tutorial', 'Career', 'Bug', 'Resource']

const TAG_OPTIONS = [
  { label: 'minishell',      color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'inception',      color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'webserv',        color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'ft_irc',         color: 'bg-green-50 text-green-600 border-green-200' },
  { label: 'transcendence',  color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'C',              color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { label: 'C++',            color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { label: 'Python',         color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
]

const RULES = [
  'Be respectful and constructive.',
  'No spam or self-promotion.',
  'Use descriptive titles.',
  'Tag your project correctly.',
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

export default function CreatePage() {
  const router = useRouter()
  const [postType, setPostType] = useState<PostType>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [catOpen, setCatOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagOpen, setTagOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TITLE_MAX = 300

  const toggleTag = (t: string) =>
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 4 ? [...prev, t] : prev
    )

  const canSubmit = title.trim().length > 0 && (
    postType === 'text' ? body.trim().length > 0
    : postType === 'link' ? url.trim().length > 0
    : true
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Create a post</h1>
        <p className="text-sm text-slate-500 mt-0.5">Share a question, project, or idea with the 42 community.</p>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Editor card ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Type tabs */}
          <div className="flex border-b border-gray-100 px-1">
            <TypeTab active={postType === 'text'}  icon={Type}       label="Text"  onClick={() => setPostType('text')} />
            <TypeTab active={postType === 'link'}  icon={Link2}      label="Link"  onClick={() => setPostType('link')} />
            <TypeTab active={postType === 'image'} icon={ImageIcon}  label="Image" onClick={() => setPostType('image')} />
          </div>

          <div className="p-6 space-y-5">

            {/* Category + Tags row */}
            <div className="flex flex-wrap gap-3">

              {/* Category dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCatOpen((v) => !v); setTagOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-gray-200 bg-white hover:border-[#8EE7E3] transition text-slate-700"
                >
                  {category}
                  <ChevronDown size={14} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                </button>
                {catOpen && (
                  <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[160px]">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setCategory(c); setCatOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#8EE7E3]/10 transition ${
                          c === category ? 'font-semibold text-[#0f6f6b]' : 'text-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setTagOpen((v) => !v); setCatOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-gray-200 bg-white hover:border-[#8EE7E3] transition text-slate-700"
                >
                  <Tag size={14} />
                  Tags {selectedTags.length > 0 && <span className="bg-[#0f6f6b] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{selectedTags.length}</span>}
                  <ChevronDown size={14} className={`transition-transform ${tagOpen ? 'rotate-180' : ''}`} />
                </button>
                {tagOpen && (
                  <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-100 rounded-xl shadow-lg p-3 min-w-[220px]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 px-1">Select up to 4</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TAG_OPTIONS.map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => toggleTag(t.label)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                            selectedTags.includes(t.label)
                              ? t.color + ' ring-2 ring-offset-1 ring-current'
                              : 'border-gray-200 text-slate-500 hover:border-gray-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected tag chips */}
              {selectedTags.map((t) => {
                const tagDef = TAG_OPTIONS.find((x) => x.label === t)
                return (
                  <span key={t} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${tagDef?.color}`}>
                    {t}
                    <button type="button" onClick={() => toggleTag(t)} className="hover:opacity-70">
                      <X size={10} />
                    </button>
                  </span>
                )
              })}
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition"
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
                <Send size={15} />
                Publish post
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
      </div>
    </div>
  )
}
