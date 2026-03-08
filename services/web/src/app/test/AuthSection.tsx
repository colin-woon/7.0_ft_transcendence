'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'testfe_access_token';

interface JwtPayload {
	sub?: string;
	upn?: string;
	groups?: string[];
	exp?: number;
}

function parseJwt(token: string): JwtPayload | null {
	try {
		return JSON.parse(atob(token.split('.')[1]));
	} catch {
		return null;
	}
}

interface AuthSectionProps {
	token: string | null;
	onToken: (t: string | null) => void;
}

export default function AuthSection({ token, onToken }: AuthSectionProps) {
	const [input,     setInput]     = useState('');
	const [showPaste, setShowPaste] = useState(false);

	const payload  = token ? parseJwt(token) : null;
	const exp      = payload?.exp ? new Date(payload.exp * 1000) : null;
	const expired  = exp ? exp < new Date() : false;
	const loggedIn = !!token && !expired;

	const appUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost';

	// Load token from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) onToken(stored);
	}, []);

	function setToken(t: string) {
		const trimmed = t.trim();
		localStorage.setItem(STORAGE_KEY, trimmed);
		onToken(trimmed);
		setInput('');
		setShowPaste(false);
	}

	function logout() {
		localStorage.removeItem(STORAGE_KEY);
		onToken(null);
		setShowPaste(false);
	}

	function openLogin() {
		window.open(`${appUrl}/auth/login/google`, '_blank', 'noopener,noreferrer');
		setShowPaste(true);
	}

	// ── Logged in ───────────────────────────────────────────────────────────────
	if (loggedIn && payload) {
		return (
			<div className="flex items-center justify-between px-3 py-2 rounded-lg
				border border-green-800 bg-green-950/30">
				<div className="flex items-center gap-2 min-w-0">
					<span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
					<div className="min-w-0">
						<p className="text-xs font-mono text-green-300 truncate">{payload.upn ?? payload.sub}</p>
						{exp && (
							<p className="text-[10px] font-mono text-slate-500">
								expires {exp.toLocaleTimeString('en-GB', { hour12: false })}
							</p>
						)}
					</div>
				</div>
				<button
					onClick={logout}
					className="shrink-0 ml-3 px-2 py-1 text-[11px] font-mono rounded border
						border-slate-700 text-slate-400 hover:border-red-700 hover:text-red-400 transition"
				>
					logout
				</button>
			</div>
		);
	}

	// ── Expired ─────────────────────────────────────────────────────────────────
	if (token && expired) {
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between px-3 py-2 rounded-lg
					border border-red-800 bg-red-950/20">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
						<p className="text-xs font-mono text-red-400">token expired</p>
					</div>
					<div className="flex gap-2">
						<button onClick={openLogin}
							className="px-2 py-1 text-[11px] font-mono rounded border
								border-blue-700 text-blue-400 hover:bg-blue-950 transition">
							re-login ↗
						</button>
						<button onClick={logout}
							className="px-2 py-1 text-[11px] font-mono rounded border
								border-slate-700 text-slate-500 hover:border-red-700 hover:text-red-400 transition">
							clear
						</button>
					</div>
				</div>
				{showPaste && <PasteInput input={input} setInput={setInput} onSet={setToken} onCancel={() => setShowPaste(false)} />}
			</div>
		);
	}

	// ── Logged out ───────────────────────────────────────────────────────────────
	return (
		<div className="space-y-2">
			<button
				onClick={openLogin}
				className="flex items-center justify-between w-full px-4 py-3 rounded-lg
					bg-slate-800 border border-slate-700 hover:border-blue-500
					hover:bg-slate-750 transition text-left group"
			>
				<div>
					<p className="text-sm font-semibold text-white group-hover:text-blue-300 transition">
						Login with Google
					</p>
					<p className="text-xs text-slate-500 mt-0.5">
						opens new tab → copy <code className="text-slate-400">accessToken</code> → paste below
					</p>
				</div>
				<span className="text-xs text-slate-600 group-hover:text-blue-500 transition">↗</span>
			</button>
			{showPaste && <PasteInput input={input} setInput={setInput} onSet={setToken} onCancel={() => setShowPaste(false)} />}
		</div>
	);
}

function PasteInput({ input, setInput, onSet, onCancel }: {
	input: string;
	setInput: (v: string) => void;
	onSet: (v: string) => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex gap-2">
			<input
				autoFocus
				value={input}
				onChange={e => setInput(e.target.value)}
				onKeyDown={e => e.key === 'Enter' && input.trim() && onSet(input)}
				placeholder="paste accessToken here…"
				className="flex-1 bg-black/60 border border-slate-700 rounded-lg px-3 py-2
					text-xs font-mono text-green-400 placeholder:text-slate-700
					focus:outline-none focus:border-blue-600"
			/>
			<button
				disabled={!input.trim()}
				onClick={() => onSet(input)}
				className="px-3 py-2 text-xs rounded-lg bg-blue-900 border border-blue-700
					text-blue-200 hover:bg-blue-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Set
			</button>
			<button
				onClick={onCancel}
				className="px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700
					text-slate-400 hover:text-slate-200 transition"
			>
				✕
			</button>
		</div>
	);
}
