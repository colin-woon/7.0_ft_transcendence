import Link from 'next/link'

export default function UserProfileNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">User Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">This user profile may have been removed or the id is invalid.</p>
        <Link
          href="/profile"
          className="inline-flex mt-5 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        >
          Back to profile
        </Link>
      </div>
    </div>
  )
}
