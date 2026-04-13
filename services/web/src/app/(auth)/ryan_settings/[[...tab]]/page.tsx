'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// TEMP: Hardcode user as admin for demo
const user = { role: 'ADMIN' };
import {
  ProfileTab,
  SecurityTab,
  SessionsTab,
  AdminTab,
} from '@/features/auth/ui_temp_ryan/settings'
import { JSX } from 'react';

const TABS = [
  { label: 'Profile', href: '/ryan_settings/profile' },
  { label: 'Security', href: '/ryan_settings/security' },
  { label: 'Sessions', href: '/ryan_settings/sessions' },
  { label: 'Admin', href: '/ryan_settings/admin' },
]

const PANELS: Record<string, React.ReactNode> = {
  '/ryan_settings/profile': <ProfileTab />,
  '/ryan_settings/security': <SecurityTab />,
  '/ryan_settings/sessions': <SessionsTab />,
  '/ryan_settings/admin': <AdminTab />,
  '/ryan_settings': <ProfileTab />,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const pathname = usePathname();
  const filteredTabs = user?.role === 'ADMIN'
    ? TABS
    : TABS.filter(tab => tab.label !== 'Admin');
  const filteredPanels: Record<string, JSX.Element> = {
    '/ryan_settings/profile': <ProfileTab />,
    '/ryan_settings/security': <SecurityTab />,
    '/ryan_settings/sessions': <SessionsTab />,
    ...(user?.role === 'ADMIN' ? { '/ryan_settings/admin': <AdminTab /> } : {}),
    '/ryan_settings': <ProfileTab />,
  };
  const activePanel = filteredPanels[pathname] ?? <ProfileTab />

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-base-content mb-5">Settings</h1>

      {/* DaisyUI tabs */}
      <div role="tablist" className="tabs tabs-bordered w-full mb-0 overflow-x-auto flex-nowrap">
        {filteredTabs.map(tab => {
          const isActive = pathname === tab.href || (pathname === '/ryan_settings' && tab.href === '/ryan_settings/profile');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              className={`tab whitespace-nowrap ${isActive ? 'tab-active' : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Panel content */}
      <div>{activePanel}</div>
    </div>
  )
}
