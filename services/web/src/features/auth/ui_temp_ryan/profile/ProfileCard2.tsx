"use client"

import { Mail, MapPin, Calendar, Shield } from "lucide-react";
import { User } from "@/features/auth/api/authService";
import ProfileCardInfo from "./ProfileCardInfo";
import ProfileLevelBar from "./ProfileLevelBar";
import EditProfileButton from "./EditProfileButton";
import GearboxButton from "./GearboxButton";
import Avatar from "./Avatar";
import React, { useState, ChangeEvent } from "react";
import { createPortal } from "react-dom";

interface ProfileCardProps {
	user: User | null;
	profile: {
		level: number;
		levelProgress: number;
		cursus: string;
		coalition: string;
		email: string;
		location: string;
		since: string;
	};
	initials: string;
    isOwnProfile: boolean;
}

export default function ProfileCard2({ user, profile, initials, isOwnProfile }: ProfileCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editDraft, setEditDraft] = useState({
    fullName: user?.fullName || "",
    avatarUrl: user?.avatarUrl || "",
    bio: user?.bio || "",
  });

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setEditDraft(d => ({ ...d, avatarUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

	return (
		<div className="card card-border bg-white/40 backdrop-blur-md w-full rounded-2xl border border-white/50 shadow-lg overflow-visible pb-5">
			{/* Avatar */}
			<figure className="h-20 bg-gradient-to-r from-[#157169] via-[#15736b] to-[#115e59] relative rounded-t-2xl w-full overflow-visible">
          <div className="absolute -bottom-10 left-6">
              <Avatar avatarUrl={user?.avatarUrl} fullName={user?.fullName} initials={initials} />
          </div>
			</figure>

      <div className="card-body pt-14 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              
              {/* Profile Info */}
              <div className="flex-1 min-w-0 pr-8">
                  <ProfileCardInfo user={user} profile={profile} />
              </div>
              
              {/* flex for edit button and lvl bar */}
              <div className="w-full sm:w-64 lg:w-72 flex flex-col gap-4 sm:gap-2 sm:mt-10 shrink-0">
                  
                  {/* Level Bar: first on mobile, outside of mobile its second */}
                  <div className="order-1 sm:order-2">
                      <ProfileLevelBar level={profile.level} levelProgress={profile.levelProgress} />
                  </div>

                  {/* Edit Button: second on mobile, first on desktop */}
                  {isOwnProfile && (
                    <div className="flex flex-row items-center gap-2 order-2 sm:order-1 sm:-mt-10">
                      <EditProfileButton onClick={() => setShowEdit(true)} />
                      {/* <GearboxButton onClick={() => setShowSettings(true)} /> */}
                    </div>
                  )}
                  
          </div>
                    
        </div>
      </div>
      {/* Edit Profile card */}
      {showEdit && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="card w-full max-w-sm bg-base-100 shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowEdit(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="card-body">
              <h2 className="card-title text-lg font-bold mb-4 text-slate-900">Edit Profile</h2>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  setShowEdit(false);
                }}
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800"
                    value={editDraft.fullName}
                    onChange={e => setEditDraft(d => ({ ...d, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#157169]/10 file:text-[#157169] hover:file:bg-[#157169]/20"
                    onChange={handleAvatarFileChange}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Choose an image.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm text-slate-800 resize-none"
                    rows={3}
                    value={editDraft.bio}
                    onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#157169] hover:bg-[#115e59] text-white text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#157169] focus:ring-offset-2"
                    >
                        Save Changes
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-600 text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                        onClick={() => setShowEdit(false)}
                    >
                        Cancel
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Settings btn (only has delete profile option) */}
      {showSettings && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="card w-full max-w-sm bg-base-100 shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowSettings(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="card-body">
              <h2 className="card-title text-lg font-bold mb-4 text-slate-900">Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Warning!!</h3>
                  <p className="text-xs text-red-600 mb-4">
                    Deleting your account is irreversible. All your data will be permanently erased and cannot be restored.
                  </p>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
                    onClick={() => {
                        if (window.confirm("Are you absolutely sure you want to delete your profile?")) {
                            alert("Profile deleted!");
                            setShowSettings(false);
                        }
                    }}
                  >
                    Delete Profile
                  </button>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-600 text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}