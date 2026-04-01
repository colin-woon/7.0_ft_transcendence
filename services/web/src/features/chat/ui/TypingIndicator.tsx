import React from 'react'
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
        JD
      </div>
      <div className="flex space-x-1.5 px-4 py-3 bg-white rounded-2xl rounded-tl-sm w-fit shadow-sm border border-slate-100">
        <div
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{
            animationDelay: '0ms',
          }}
        />
        <div
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{
            animationDelay: '150ms',
          }}
        />
        <div
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{
            animationDelay: '300ms',
          }}
        />
      </div>
    </div>
  )
}
