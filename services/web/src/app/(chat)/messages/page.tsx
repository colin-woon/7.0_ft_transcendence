'use client';

import React from 'react';
import Link from 'next/link';

export default function MessagesLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-base-100 text-base-content/60">
      
      {/* Discord-style Empty State Illustration */}
      <div className="bg-base-200 mask mask-hexagon w-32 h-32 flex items-center justify-center mb-6 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-base-content mb-2">No Chat Selected</h2>
      <p className="text-sm max-w-sm text-center mb-6">
        Choose an existing conversation from the sidebar or start a new one to begin messaging.
      </p>

      {/* Quick link back to friends list */}
      <Link href="/friends" className="btn btn-primary btn-sm">
        Go to Friends
      </Link>
    </div>
  );
}