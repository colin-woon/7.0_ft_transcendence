import mascotCat from '@/components/ui/imgs/42_oveflow_mascot_cat.png';


export function LoginHeader() {
  return (
    <div className="text-center space-y-2">
      <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center mx-auto border border-white/100 mb-4 text-indigo-600 animate-[fade-up_0.5s_0.1s_ease-out_both]">
        <img
          src={mascotCat.src}
          alt="42 Overflow Mascot Cat"
          className="w-20 h-20 object-contain"
        />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 animate-[fade-up_0.5s_0.15s_ease-out_both]">
        Welcome back
      </h1>
      <p className="text-sm text-slate-500 animate-[fade-up_0.5s_0.2s_ease-out_both]">
        Sign in securely with Google or 42
      </p>
    </div>
  )
}