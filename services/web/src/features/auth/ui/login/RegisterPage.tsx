"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthApiError } from '@/features/auth/api/authService'
import { useAuth } from '@/features/auth/models/AuthContext'
import {
  registerWithPasswordSchema,
  type PasswordRegisterFormValues,
} from '@/features/auth/validation/authSchemas'
import { fileToDataUrl } from '@/features/auth/utils/avatarFile'
import { BackgroundBlobs } from '@/features/auth/ui/login/BackgroundBlobs'
import { GlassCard } from '@/features/auth/ui/login/GlassCard'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-600 mt-1">{message}</p>
}

interface RegisterPageProps {
  initialEmail?: string
}

export default function RegisterPage({ initialEmail = '' }: RegisterPageProps) {
  const router = useRouter()
  const { registerWithPassword } = useAuth()

  const [values, setValues] = useState<PasswordRegisterFormValues>({
    email: initialEmail,
    username: '',
    fullName: '',
    avatarFile: '',
    bio: '',
    password: '',
    confirmPassword: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [errors, setErrors] = useState<Partial<Record<keyof PasswordRegisterFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting])

  const handleChange = (key: keyof PasswordRegisterFormValues, value: string) => {
    setValues((prev: PasswordRegisterFormValues) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setFormError(null)
  }

  const parseErrors = (result: ReturnType<typeof registerWithPasswordSchema.safeParse>) => {
    if (result.success) return {}
    const fieldErrors: Partial<Record<keyof PasswordRegisterFormValues, string>> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof PasswordRegisterFormValues | undefined
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return fieldErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = registerWithPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(parseErrors(parsed))
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const avatarPayload = avatarFile ? await fileToDataUrl(avatarFile) : undefined
      await registerWithPassword({
        ...parsed.data,
        avatarFile: avatarPayload,
      })
      router.push('/profile')
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 409) {
        if (error.message.toLowerCase().includes('username')) {
          setFormError('That username is already taken. Please choose a different username.')
        } else {
          setFormError('An account with this email already exists. If it was created with Google/42, sign in with that provider first.')
        }
      } else {
        setFormError(error instanceof Error ? error.message : 'Registration failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-white p-8 sm:p-12 font-sans text-slate-800 overflow-hidden relative">
      <BackgroundBlobs />

      <div className="w-full max-w-lg relative animate-[fade-up_0.7s_ease-out_both]">
        <GlassCard>
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
              <p className="text-xs text-slate-500 mt-2">Use email and password to create your Overflow identity.</p>
            </div>

            <form className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
              <div className="sm:col-span-2">
                <input
                  type="email"
                  autoComplete="email"
                  aria-label="Email"
                  placeholder="Email"
                  value={values.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <input
                  type="text"
                  autoComplete="username"
                  aria-label="Username"
                  placeholder="Username"
                  value={values.username}
                  onChange={(event) => handleChange('username', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.username} />
              </div>

              <div>
                <input
                  type="text"
                  autoComplete="name"
                  aria-label="Full name"
                  placeholder="Full name"
                  value={values.fullName}
                  onChange={(event) => handleChange('fullName', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.fullName} />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="w-full inline-flex items-center justify-center border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700 cursor-pointer">
                  Choose avatar image (optional)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                {avatarFile ? <p className="text-xs text-slate-500">Selected: {avatarFile.name}</p> : null}
                <FieldError message={errors.avatarFile} />
              </div>

              <div className="sm:col-span-2">
                <textarea
                  aria-label="Bio (optional)"
                  placeholder="Bio (optional)"
                  value={values.bio ?? ''}
                  onChange={(event) => handleChange('bio', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700 min-h-20"
                />
                <FieldError message={errors.bio} />
              </div>

              <div>
                <input
                  type="password"
                  autoComplete="new-password"
                  aria-label="Password"
                  placeholder="Password"
                  value={values.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.password} />
              </div>

              <div>
                <input
                  type="password"
                  autoComplete="new-password"
                  aria-label="Repeat password"
                  placeholder="Repeat password"
                  value={values.confirmPassword}
                  onChange={(event) => handleChange('confirmPassword', event.target.value)}
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.confirmPassword} />
              </div>

              {formError ? <p className="sm:col-span-2 text-xs text-red-600">{formError}</p> : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="sm:col-span-2 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-2.5 px-4 rounded-xl transition-all duration-150 text-sm font-medium"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              Already have an account? Sign in
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
