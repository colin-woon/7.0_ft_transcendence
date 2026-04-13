"use client";
import Link from "next/link";
import { Home, MessageCircle, Shield, FileText, LogOut, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/models/AuthContext";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/ui/ComponentLogic/Appshell/context/AppShellContext";
// import PrivacyPolicy from "@/components/legal/PrivacyPolicy";
// import TermsCondition from "@/components/legal/TermsCondition";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isSidebarOpen: isOpen, closeSidebar: onClose } = useAppShell();
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<"privacy" | "terms">("privacy");

  const initials = user
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'G';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isPolicyOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPolicyOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPolicyOpen]);

  const openPolicyModal = (tab: "privacy" | "terms") => {
    onClose();
    setPolicyTab(tab);
    setIsPolicyOpen(true);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside className={`absolute md:relative h-full flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out z-50 ${
        isOpen ? 'w-64 md:w-72 lg:w-60' : 'w-0'
      }`}>
        <div className="h-full flex flex-col bg-white border-r border-gray-200">

          {/* User Profile Block */}
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName ?? 'Guest'}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500">
                {user?.role ?? 'STUDENT'}
              </span>
            </div>
          </Link>

          {/* Main Nav */}
          <div className="p-3 border-b border-gray-200">
            <nav className="space-y-1">
              <Link onClick={onClose} href="/projects" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <Home size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Home</span>
              </Link>
              <Link onClick={onClose} href="/messages" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <MessageCircle size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Chat</span>
              </Link>
            </nav>
          </div>

          {/* Resources Section */}
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Resources</h3>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition"
                onClick={() => openPolicyModal("privacy")}
              >
                <Shield size={18} className="text-slate-600" />
                <span className="text-xs">Privacy Policy</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition"
                onClick={() => openPolicyModal("terms")}
              >
                <FileText size={18} className="text-slate-600" />
                <span className="text-xs">Terms & Conditions</span>
              </button>
              </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPolicyModal("privacy")}
                  className="hover:underline"
                >
                  Privacy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => openPolicyModal("terms")}
                  className="hover:underline"
                >
                  Terms
                </button>
              </div>
              <p className="text-gray-400">42 overflow, Inc. © 2026</p>
            </div>
          </div>

        </div>
      </aside>

      {isPolicyOpen && (
        <div
          className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setIsPolicyOpen(false)}
        >
          <div
            className="mx-auto flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,6,23,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Legal</p>
                <h2 className="text-sm font-semibold text-slate-900">
                  {policyTab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsPolicyOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close policy modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {/* {policyTab === "privacy" ? <PrivacyPolicy /> : <TermsCondition />} */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}