export default function UserProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#0f6f6b] animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading user profile...</p>
      </div>
    </div>
  )
}
