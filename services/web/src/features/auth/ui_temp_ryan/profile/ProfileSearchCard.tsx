'use client'

import { Search } from 'lucide-react'
import React, { useState } from 'react'

export default function ProfileSearchCard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Find Users</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        
        <form
          className="flex flex-col gap-2 pt-2 h-full"
          onSubmit={e => {
            e.preventDefault();
            alert(`Searching for: ${searchQuery}`);
          }}
        >
          <input
            type="text"
            placeholder="Search username..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          {!searchQuery && (
            <div className="flex flex-col items-center justify-center flex-1 text-center opacity-70 mt-4 mb-4">
              <div className="p-3 bg-[#157169]/10 rounded-full text-[#157169] mb-3">
                <Search size={24} />
              </div>
              <p className="text-sm font-medium text-slate-800">Search Directory</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[200px]">
                You can search for other users here. Look up their username or full name.
              </p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full px-4 py-2 mt-auto bg-[#157169] hover:bg-[#115e59] text-white text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#157169] focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
