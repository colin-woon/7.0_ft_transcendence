'use client'

import { useState } from 'react'
import { SectionLabel, SettingRow, Toggle } from './Primitives'

export function SecurityTab({ hasPassword = false }: { hasPassword?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Hook up actual password change logic
    console.log("Submitting password change...", { currentPassword, newPassword, confirmPassword })
    closeModal()
  }

  return (
    <>
      <SectionLabel>Password</SectionLabel>
      <SettingRow 
        title="Password" 
        subtitle={hasPassword ? "Change your existing password" : "You haven't set a local password yet"}
        right={
          <button onClick={openModal} className="btn btn-sm btn-neutral rounded-full font-semibold px-4">
            {hasPassword ? 'Change Password' : 'Set Password'}
          </button>
        }
      />
      
      <SectionLabel>Privacy</SectionLabel>
      <SettingRow 
        title="Hide from search" 
        subtitle="Prevent other users from finding your profile"
        right={<Toggle />} 
      />

      <SectionLabel>Deleting Account</SectionLabel>
      <SettingRow
        title="Delete account"
        subtitle="Permanently remove your profile and all account data"
        right={
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="btn btn-sm btn-error text-white rounded-full font-semibold px-4"
          >
            Delete
          </button>
        }
      />

      {/* Password Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box bg-white border border-slate-200">
          <h3 className="font-bold text-lg text-slate-900">
            {hasPassword ? 'Change Password' : 'Set Password'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {hasPassword ? 'Enter your current password to update it.' : 'Create a new password to sign in locally.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {hasPassword && (
              <div>
                <label className="label py-1">
                  <span className="label-text font-semibold text-slate-700">Current Password</span>
                </label>
                <input 
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required={hasPassword} 
                />
              </div>
            )}
            <div>
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-700">New Password</span>
              </label>
              <input 
                type="password"
                placeholder="Enter new password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required 
              />
            </div>
            <div>
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-700">Confirm New Password</span>
              </label>
              <input 
                type="password" 
                placeholder="Confirm new password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
            <div className="modal-action mt-6">
              <button type="button" className="btn btn-sm btn-ghost rounded-xl" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-sm bg-[#0f6f6b] hover:bg-[#0a5a56] text-white border-0 rounded-xl">Save</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-slate-900/20 backdrop-blur-[1px]" onClick={closeModal}>
          <button>close</button>
        </form>
      </dialog>

      {/* Delete Account Modal */}
      <dialog className={`modal ${isDeleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box bg-white border border-red-200">
          <h3 className="font-bold text-lg text-red-700">Delete Account</h3>
          <p className="text-sm text-red-600 mt-2">
            This action is irreversible. Your account and all associated data will be permanently deleted.
          </p>

          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-sm btn-ghost rounded-xl"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-error text-white rounded-xl"
              onClick={() => {
                alert('Profile deleted!')
                setIsDeleteModalOpen(false)
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop bg-slate-900/20 backdrop-blur-[1px]"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}
