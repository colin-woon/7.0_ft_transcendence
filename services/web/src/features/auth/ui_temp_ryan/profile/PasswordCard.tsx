'use client'

import { KeyRound } from 'lucide-react'
import React, { useState } from 'react'

interface PasswordCardProps {
  isOwnProfile: boolean
  hasPassword?: boolean
}

export default function PasswordCard({ isOwnProfile, hasPassword }: PasswordCardProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOwnProfile) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Security</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Password section */}
        <div className="flex items-start gap-4 mt-2">
          <div className="p-2 bg-[#157169]/10 rounded-lg text-[#157169] mt-1">
            <KeyRound size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Change Password</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
        </div>

        {/* Change password form */}
        <form
          className="flex flex-col gap-2 pt-2"
          onSubmit={e => {
            e.preventDefault();
            // Add your password change logic here
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            alert("Password changed!");
          }}
        >
            <input
              type="password"
              placeholder="Old password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#157169] hover:bg-[#115e59] text-white text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#157169] focus:ring-offset-2 mt-1"
            >
              Change Password
            </button>
          </form>
      </div>
    </div>
  );
}
