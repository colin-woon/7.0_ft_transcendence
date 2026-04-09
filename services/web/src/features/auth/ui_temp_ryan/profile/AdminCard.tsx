'use client'

import React, { useState } from 'react'

export default function AdminCard() {
  const [adminUpdateForm, setAdminUpdateForm] = useState({
    userId: '',
    role: '',
    isBanned: '',
  });

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'STUDENT',
  });

  const handleAdminUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Updated User ID: ${adminUpdateForm.userId}`);
  };

  const handleAdminCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Created User: ${newUserForm.username}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Control Panel</p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-slate-800 mb-3">Update User</p>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleAdminUpdateUser}>
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              placeholder="User ID"
              value={adminUpdateForm.userId}
              onChange={(e) => setAdminUpdateForm((prev) => ({ ...prev, userId: e.target.value }))}
              required
            />
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              value={adminUpdateForm.role}
              onChange={(e) => setAdminUpdateForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="">Role unchanged</option>
              <option value="STUDENT">STUDENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              value={adminUpdateForm.isBanned}
              onChange={(e) => setAdminUpdateForm((prev) => ({ ...prev, isBanned: e.target.value }))}
            >
              <option value="">Ban unchanged</option>
              <option value="false">Unban</option>
              <option value="true">Ban</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
            >
              Update User
            </button>
          </form>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-slate-800 mb-3">Create User</p>
          <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleAdminCreateUser}>
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              placeholder="Username"
              value={newUserForm.username}
              onChange={(e) => setNewUserForm((prev) => ({ ...prev, username: e.target.value }))}
              required
              minLength={3}
            />
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              placeholder="Full Name"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              placeholder="Email"
              type="email"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800"
              value={newUserForm.role}
              onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="STUDENT">STUDENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium rounded-xl bg-[#157169] hover:bg-[#115e59] text-white transition focus:outline-none focus:ring-2 focus:ring-[#157169] focus:ring-offset-2"
            >
              Create User
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
