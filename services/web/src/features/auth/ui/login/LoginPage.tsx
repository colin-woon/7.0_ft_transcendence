"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/models/AuthContext";
import { BackgroundBlobs } from "@/features/auth/ui/login/BackgroundBlobs";
import { GlassCard } from "@/features/auth/ui/login/GlassCard";
import { LoginHeader } from "@/features/auth/ui/login/LoginHeader";
import {
  loginWithPasswordSchema,
  type PasswordLoginFormValues,
} from "@/features/auth/validation/authSchemas";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPassword } = useAuth();

  const [values, setValues] = useState<PasswordLoginFormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof PasswordLoginFormValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  const handleChange = (key: keyof PasswordLoginFormValues, value: string) => {
    setValues((prev: PasswordLoginFormValues) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  };

  const parseErrors = (
    result: ReturnType<typeof loginWithPasswordSchema.safeParse>,
  ) => {
    if (result.success) return {};
    const fieldErrors: Partial<Record<keyof PasswordLoginFormValues, string>> =
      {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof PasswordLoginFormValues | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return fieldErrors;
  };

  const submitPasswordLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const parsed = loginWithPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(parseErrors(parsed));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await loginWithPassword(parsed.data);
      router.push("/profile");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-white p-8 sm:p-12 font-sans text-slate-800 overflow-hidden relative">
      <BackgroundBlobs />

      <div className="w-full max-w-md relative animate-[fade-up_0.7s_ease-out_both]">
        <GlassCard>
          <div className="flex flex-col items-center space-y-6">
            <LoginHeader />

            <div className="w-full space-y-3 animate-[fade-up_0.5s_0.2s_ease-out_both]">
              <button
                type="button"
                onClick={() => login("google")}
                className="w-full flex items-center justify-center gap-3 bg-white/70 hover:bg-white/90 active:scale-[0.98] border border-white/70 text-slate-700 py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm"
              >
                <span className="text-sm font-medium">
                  Continue with Google
                </span>
              </button>

              <button
                type="button"
                onClick={() => login("42")}
                className="w-full flex items-center justify-center gap-3 bg-[#0f6f6b]/90 hover:bg-[#0f6f6b] active:scale-[0.98] border border-[#0f6f6b] text-white py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm"
              >
                <span className="text-sm font-medium">Continue with 42</span>
              </button>
            </div>

            <div className="w-full flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-300" />
              <span className="text-xs uppercase tracking-wide text-slate-500">
                or
              </span>
              <div className="h-px flex-1 bg-slate-300" />
            </div>

            <form className="w-full space-y-3" onSubmit={submitPasswordLogin}>
              <div>
                <input
                  type="email"
                  autoComplete="email"
                  aria-label="Email"
                  placeholder="Email"
                  value={values.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <input
                  type="password"
                  autoComplete="current-password"
                  aria-label="Password"
                  placeholder="Password"
                  value={values.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  className="w-full border border-slate-300 bg-white/80 rounded-xl px-3 py-2.5 text-sm text-slate-700"
                />
                <FieldError message={errors.password} />
              </div>

              {formError ? (
                <p className="text-xs text-red-600">{formError}</p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-2.5 px-4 rounded-xl transition-all duration-150 text-sm font-medium"
              >
                {isSubmitting ? "Signing in..." : "Sign in with Email"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
            >
              New to Overflow? Create your account
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
