'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  MessageCircle, X, Send, Minus, Maximize2,
  Search, Phone, Video, UserPlus, MoreHorizontal,
  Smile, Paperclip, Gift,
} from 'lucide-react'
import { useAppShell } from '../context/AppShellContext'

// ── Types & mock data ──────────────────────────────────────────────────────────

type Message = { id: number; from: 'me' | 'them'; text: string; time: string }

interface Convo {
  id: number
  name: string
  username: string
  initials: string
  gradient: string
  lastMsg: string
  time: string
  unread: number
  online: boolean
  messages: Message[]
}

const CONVOS: Convo[] = [
  {
    id: 1, name: 'Alex Kim', username: 'akim', initials: 'AK',
    gradient: 'from-cyan-400 to-blue-500', lastMsg: 'Did you finish the minishell?',
    time: '2m', unread: 2, online: true,
    messages: [
      { id: 1, from: 'them', text: 'Hey, how is minishell going?', time: '10:01' },
      { id: 2, from: 'me',   text: 'Almost done, just builtins left', time: '10:03' },
      { id: 3, from: 'them', text: 'Nice! Which builtins?', time: '10:04' },
      { id: 4, from: 'me',   text: 'cd, env, export, unset', time: '10:04' },
      { id: 5, from: 'them', text: 'Did you finish the minishell?', time: '10:05' },
    ],
  },
  {
    id: 2, name: 'Priya Nair', username: 'pnair', initials: 'PN',
    gradient: 'from-pink-400 to-purple-500', lastMsg: 'Come check the norminette errors',
    time: '15m', unread: 0, online: true,
    messages: [
      { id: 1, from: 'them', text: 'My ft_printf is failing on %', time: '09:40' },
      { id: 2, from: 'me',   text: 'Check the flags handling', time: '09:42' },
      { id: 3, from: 'them', text: 'Come check the norminette errors', time: '09:50' },
    ],
  },
  {
    id: 3, name: 'Luca Ricci', username: 'lricci', initials: 'LR',
    gradient: 'from-orange-400 to-red-500', lastMsg: 'Eval tomorrow 9am works?',
    time: '1h', unread: 1, online: false,
    messages: [
      { id: 1, from: 'them', text: 'Hey can you eval me?', time: '08:00' },
      { id: 2, from: 'me',   text: 'Sure, when?', time: '08:05' },
      { id: 3, from: 'them', text: 'Eval tomorrow 9am works?', time: '08:10' },
    ],
  },
  {
    id: 4, name: 'Sara Müller', username: 'smuller', initials: 'SM',
    gradient: 'from-emerald-400 to-teal-500', lastMsg: 'Thanks for the tip on malloc!',
    time: '3h', unread: 0, online: false,
    messages: [
      { id: 1, from: 'me',   text: 'Always null-check after malloc', time: '07:00' },
      { id: 2, from: 'them', text: 'Thanks for the tip on malloc!', time: '07:30' },
    ],
  },
]

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ convo, size = 'md', showStatus = false, statusBg = 'white' }: {
  convo: Convo; size?: 'sm' | 'md' | 'lg'; showStatus?: boolean; statusBg?: string
}) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-8 h-8 text-xs'
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-white font-bold`}>
        {convo.initials}
      </div>
      {showStatus && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-${statusBg} ${
          convo.online ? 'bg-green-400' : 'bg-gray-500'
        }`} style={{ borderColor: statusBg === 'discord' ? '#2b2d31' : undefined }} />
      )}
    </div>
  )
}

// ── Discord expanded view ──────────────────────────────────────────────────────

function DiscordView({ initialConvo, onClose }: { initialConvo: Convo; onClose: () => void }) {
  const [active, setActive] = useState<Convo>(initialConvo)
  const [convos, setConvos] = useState<Convo[]>(CONVOS)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  const msgs = convos.find((c) => c.id === active.id)?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, active])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setConvos((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { id: Date.now(), from: 'me', text, time }], lastMsg: text }
          : c
      )
    )
    setInput('')
  }

  const filtered = convos.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={ref}
        className="flex w-[860px] max-w-[96vw] h-[580px] max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 animate-[fade-up_0.2s_ease-out_both]"
      >
        {/* ── Left sidebar ─────────────────── */}
        <div className="w-60 flex-shrink-0 flex flex-col bg-[#2b2d31]">

          {/* Search */}
          <div className="px-3 pt-3 pb-2 border-b border-black/20">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#949ba4]" />
              <input
                placeholder="Find a conversation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-[#1e1f22] rounded-md text-xs text-[#dbdee1] placeholder-[#949ba4] outline-none"
              />
            </div>
          </div>

          {/* DM list */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#949ba4] px-2 pb-1">
              Direct Messages
            </p>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md transition group ${
                  active.id === c.id ? 'bg-[#404249]' : 'hover:bg-[#35373c]'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                    {c.initials}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${c.online ? 'bg-green-400' : 'bg-[#747f8d]'}`} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-medium truncate ${active.id === c.id ? 'text-white' : 'text-[#dbdee1]'}`}>{c.name}</p>
                  <p className="text-[11px] text-[#949ba4] truncate">{c.online ? 'Online' : 'Offline'}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#2b2d31] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Me strip */}
          <div className="flex items-center gap-2 px-2 py-2.5 bg-[#232428] border-t border-black/30">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">JD</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#232428]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-none">jdoe</p>
              <p className="text-[10px] text-[#949ba4] mt-0.5">Online</p>
            </div>
            <button className="p-1 hover:bg-white/10 rounded transition">
              <UserPlus size={14} className="text-[#949ba4]" />
            </button>
          </div>
        </div>

        {/* ── Main area ─────────────────────── */}
        <div className="flex-1 flex flex-col bg-[#313338] min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#313338] border-b border-black/20 flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${active.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                  {active.initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${active.online ? 'bg-green-400' : 'bg-[#747f8d]'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">{active.name}</p>
                <p className="text-[10px] mt-0.5">{active.online
                  ? <span className="text-green-400">● Online</span>
                  : <span className="text-[#949ba4]">○ Offline</span>
                }</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[Phone, Video, Search, MoreHorizontal].map((Icon, i) => (
                <button key={i} className="p-1.5 rounded-md hover:bg-white/10 transition text-[#949ba4] hover:text-white">
                  <Icon size={17} />
                </button>
              ))}
              <div className="w-px h-4 bg-white/10 mx-1.5" />
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 transition text-[#949ba4] hover:text-red-400">
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
            {/* DM intro */}
            <div className="mb-6 pb-4 border-b border-white/5">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${active.gradient} flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg`}>
                {active.initials}
              </div>
              <h3 className="text-xl font-bold text-white">{active.name}</h3>
              <p className="text-sm text-[#949ba4] mt-1">
                Beginning of your direct message history with{' '}
                <span className="text-white font-semibold">@{active.username}</span>.
              </p>
            </div>

            {msgs.map((m, i) => {
              const grouped = i > 0 && msgs[i - 1].from === m.from
              return (
                <div key={m.id} className={`flex gap-3 group ${grouped ? 'mt-0.5' : 'mt-4'}`}>
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    {!grouped && (
                      m.from === 'me'
                        ? <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">JD</div>
                        : <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${active.gradient} flex items-center justify-center text-white text-xs font-bold`}>{active.initials}</div>
                    )}
                    {grouped && (
                      <span className="text-[9px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity leading-relaxed">
                        {m.time}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white hover:underline cursor-pointer">
                          {m.from === 'me' ? 'jdoe' : active.username}
                        </span>
                        <span className="text-[10px] text-[#949ba4]">{m.time}</span>
                      </div>
                    )}
                    <p className={`text-sm text-[#dbdee1] leading-relaxed group-hover:bg-white/[0.03] rounded px-1 -mx-1 transition-colors ${grouped ? 'py-0.5' : ''}`}>
                      {m.text}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-5 pt-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#383a40] rounded-xl px-3 py-2.5">
              <button className="p-1 hover:bg-white/10 rounded-md transition text-[#949ba4] hover:text-[#dbdee1] flex-shrink-0">
                <Paperclip size={19} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={`Message @${active.username}`}
                className="flex-1 bg-transparent text-sm text-[#dbdee1] placeholder-[#949ba4] outline-none"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-1 hover:bg-white/10 rounded-md transition text-[#949ba4] hover:text-[#dbdee1]"><Gift size={19} /></button>
                <button className="p-1 hover:bg-white/10 rounded-md transition text-[#949ba4] hover:text-[#dbdee1]"><Smile size={19} /></button>
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-md transition text-[#949ba4] hover:text-white disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small floating chat window ─────────────────────────────────────────────────

function ChatWindow({ convo, onClose, onMinimize, onExpand, minimized }: {
  convo: Convo; onClose: () => void; onMinimize: () => void
  onExpand: () => void; minimized: boolean
}) {
  const [messages, setMessages] = useState<Message[]>(convo.messages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, minimized])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ])
    setInput('')
  }

  return (
    <div className="flex flex-col w-72 bg-white rounded-t-xl shadow-xl border border-gray-200 overflow-hidden animate-[fade-up_0.2s_ease-out_both]">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white border-b border-gray-100 cursor-pointer select-none" onClick={onMinimize}>
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {convo.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{convo.name}</p>
          <p className="text-[10px] text-slate-400">@{convo.username}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onExpand() }} className="p-1 hover:bg-gray-100 rounded-full transition" title="Expand to Discord view">
            <Maximize2 size={13} className="text-slate-400" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMinimize() }} className="p-1 hover:bg-gray-100 rounded-full transition">
            <Minus size={13} className="text-slate-400" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={13} className="text-slate-400" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="h-64 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3 py-1.5 rounded-2xl text-sm leading-snug ${
                  m.from === 'me'
                    ? 'bg-[#0f6f6b] text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  {m.text}
                  <span className={`block text-[9px] mt-0.5 ${m.from === 'me' ? 'text-white/60 text-right' : 'text-slate-400'}`}>{m.time}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Message..."
              className="flex-1 text-sm bg-gray-100 rounded-full px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 placeholder-gray-400"
            />
            <button onClick={send} disabled={!input.trim()} className="w-8 h-8 rounded-full bg-[#0f6f6b] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#0c5d5a] transition-colors flex-shrink-0">
              <Send size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Inbox panel ────────────────────────────────────────────────────────────────

function InboxPanel({ onOpen, onExpand, onClose }: {
  onOpen: (c: Convo) => void; onExpand: (c: Convo) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const totalUnread = CONVOS.reduce((s, c) => s + c.unread, 0)

  return (
    <div ref={ref} className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fade-up_0.2s_ease-out_both] z-[80]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-[#0f6f6b]" />
          <span className="font-semibold text-slate-800 text-sm">Messages</span>
          {totalUnread > 0 && <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { onExpand(CONVOS[0]); onClose() }} className="p-1 hover:bg-gray-100 rounded-full transition" title="Open Discord view">
            <Maximize2 size={14} className="text-slate-400" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {CONVOS.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
            <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => { onOpen(c); onClose() }}>
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-sm font-bold`}>{c.initials}</div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${c.online ? 'bg-green-400' : 'bg-gray-300'}`} />
                {c.unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{c.unread}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{c.name}</span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{c.time}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{c.lastMsg}</p>
              </div>
            </button>
            <button onClick={() => { onExpand(c); onClose() }} className="p-1.5 hover:bg-gray-200 rounded-full transition opacity-0 group-hover:opacity-100 flex-shrink-0" title="Discord view">
              <Maximize2 size={13} className="text-slate-500" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5">
        <button onClick={() => { onExpand(CONVOS[0]); onClose() }} className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#0f6f6b] hover:text-[#0c5d5a] transition-colors">
          <Maximize2 size={12} />
          Open full chat
        </button>
      </div>
    </div>
  )
}

// ── Root widget ────────────────────────────────────────────────────────────────

interface OpenWindow { convo: Convo; minimized: boolean }

export default function ChatWidget() {
  const { isChatOpen, openChatInbox, closeChatInbox } = useAppShell()
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([])
  const [discordConvo, setDiscordConvo] = useState<Convo | null>(null)

  const openChat = useCallback((convo: Convo) => {
    setOpenWindows((prev) => {
      if (prev.find((w) => w.convo.id === convo.id))
        return prev.map((w) => w.convo.id === convo.id ? { ...w, minimized: false } : w)
      return [...prev, { convo, minimized: false }].slice(-3)
    })
  }, [])

  const openDiscord = useCallback((convo: Convo) => {
    setDiscordConvo(convo)
    closeChatInbox()
  }, [closeChatInbox])

  const closeWindow = (id: number) => setOpenWindows((p) => p.filter((w) => w.convo.id !== id))
  const toggleMinimize = (id: number) => setOpenWindows((p) => p.map((w) => w.convo.id === id ? { ...w, minimized: !w.minimized } : w))
  const totalUnread = CONVOS.reduce((s, c) => s + c.unread, 0)

  return (
    <>
      {discordConvo && <DiscordView initialConvo={discordConvo} onClose={() => setDiscordConvo(null)} />}

      <div className="fixed bottom-0 right-4 z-[70] flex items-end gap-2">
        {openWindows.map((w) => (
          <ChatWindow
            key={w.convo.id}
            convo={w.convo}
            minimized={w.minimized}
            onClose={() => closeWindow(w.convo.id)}
            onMinimize={() => toggleMinimize(w.convo.id)}
            onExpand={() => { openDiscord(w.convo); closeWindow(w.convo.id) }}
          />
        ))}

        <div className="relative flex-shrink-0">
          {isChatOpen && <InboxPanel onOpen={openChat} onExpand={openDiscord} onClose={closeChatInbox} />}
          <button
            onClick={isChatOpen ? closeChatInbox : openChatInbox}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors relative ${
              isChatOpen ? 'bg-[#0f6f6b] text-white' : 'bg-white text-slate-700 hover:bg-[#8EE7E3]/30 border border-slate-200'
            }`}
          >
            <MessageCircle size={22} />
            {totalUnread > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
