'use client';

import { useState, useEffect, useRef } from 'react';
import pingWithAuth from './pingWithAuth';
import pingNoAuth from './pingNoAuth';
import pingNoCert from './pingNoCert';
import rateLimitBurst, { type RateLimitBurstResult, type BurstMode, type BurstGroupResult } from './rateLimitBurst';
import AuthSection from './AuthSection';
import type { HttpResult } from './types';

// ── Connectivity buttons ──────────────────────────────────────────────────────

function pingButtons(token: string | null): Array<{ label: string; desc: string; fn: () => Promise<HttpResult> }> {
	return [
		{ label: 'Ping + Auth', desc: 'mTLS cert + Bearer token',   fn: () => pingWithAuth(token ?? undefined) },
		{ label: 'Ping – Auth', desc: 'mTLS cert, no token',        fn: pingNoAuth   },
		{ label: 'Ping – Cert', desc: 'No client cert (mTLS fail)', fn: pingNoCert   },
	];
}

const BURST_COUNTS = [10, 30, 70] as const;

const BURST_MODES: Array<{ value: BurstMode; label: string; desc: string }> = [
	{ value: 'auth',   label: '+ Auth',  desc: 'Bearer token on every request → keyed by ip+userId' },
	{ value: 'noauth', label: '– Auth',  desc: 'No token → keyed by IP only'                        },
	{ value: 'mixed',  label: 'Mixed',   desc: 'Half authed, half anon — proves buckets are separate' },
];

// ── Sub-section label ─────────────────────────────────────────────────────────

function SubHeader({ label }: { label: string }) {
	return (
<div className="flex items-center gap-2 mb-1">
			<span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
				{label}
			</span>
			<div className="flex-1 h-px bg-slate-800" />
		</div>
	);
}

// ── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
	return (
<div className="flex flex-col items-center gap-0.5 bg-slate-800/60 rounded-md py-2 px-1">
			<span className={`text-lg font-bold font-mono leading-none ${color}`}>{value}</span>
			<span className="text-[9px] uppercase tracking-wide text-slate-500">{label}</span>
		</div>
	);
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function BurstBar({ sent, ok, rateLimited, errors }: BurstGroupResult) {
	const pctOk  = Math.round((ok          / sent) * 100);
	const pctRl  = Math.round((rateLimited / sent) * 100);
	const pctErr = Math.round((errors       / sent) * 100);
	return (
<div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
			<div className="bg-green-500  transition-all" style={{ width: `${pctOk}%`  }} />
			<div className="bg-yellow-500 transition-all" style={{ width: `${pctRl}%`  }} />
			<div className="bg-red-500    transition-all" style={{ width: `${pctErr}%` }} />
		</div>
	);
}

// ── Rate-limit result card ────────────────────────────────────────────────────

function RateLimitResultCard({ r }: { r: RateLimitBurstResult }) {
	const extra = Object.entries(r.statusBreakdown).filter(
([code]) => code !== '200' && code !== '429' && code !== '0',
	);

	return (
<div className="rounded-lg border border-slate-700 bg-black/50 p-3 space-y-3">

			{r.mode === 'mixed' && r.groups ? (
// Mixed mode: side-by-side per-bucket breakdown
<>
					<div className="grid grid-cols-2 gap-3">
						{/* Auth bucket */}
						<div className="space-y-2">
							<p className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
								Auth bucket
							</p>
							<div className="grid grid-cols-3 gap-1 text-center">
								<StatBox label="Sent" value={r.groups.auth.sent}         color="text-slate-300"  />
								<StatBox label="200"  value={r.groups.auth.ok}           color="text-green-400"  />
								<StatBox label="429"  value={r.groups.auth.rateLimited}  color="text-yellow-400" />
							</div>
							<BurstBar {...r.groups.auth} />
						</div>

						{/* Anon bucket */}
						<div className="space-y-2">
							<p className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
								Anon bucket
							</p>
							<div className="grid grid-cols-3 gap-1 text-center">
								<StatBox label="Sent" value={r.groups.noauth.sent}         color="text-slate-300"  />
								<StatBox label="200"  value={r.groups.noauth.ok}           color="text-green-400"  />
								<StatBox label="429"  value={r.groups.noauth.rateLimited}  color="text-yellow-400" />
							</div>
							<BurstBar {...r.groups.noauth} />
						</div>
					</div>

					{/* combined divider */}
					<div className="h-px bg-slate-800" />
					<div className="grid grid-cols-4 gap-2 text-center">
						<StatBox label="Total"  value={r.sent}         color="text-slate-300"  />
						<StatBox label="200 OK" value={r.ok}           color="text-green-400"  />
						<StatBox label="429 RL" value={r.rateLimited}  color="text-yellow-400" />
						<StatBox label="Error"  value={r.errors}       color="text-red-400"    />
					</div>
				</>
			) : (
// Single-mode: flat stats + bar
<>
					<div className="grid grid-cols-4 gap-2 text-center">
						<StatBox label="Sent"   value={r.sent}         color="text-slate-300"  />
						<StatBox label="200 OK" value={r.ok}           color="text-green-400"  />
						<StatBox label="429 RL" value={r.rateLimited}  color="text-yellow-400" />
						<StatBox label="Error"  value={r.errors}       color="text-red-400"    />
					</div>
					<BurstBar sent={r.sent} ok={r.ok} rateLimited={r.rateLimited} errors={r.errors} />
				</>
			)}

			{/* footer */}
			<div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
				<span>{r.durationMs} ms total</span>
				{extra.length > 0 && (
					<span className="text-slate-400">
						other: {extra.map(([c, n]) => `${c}×${n}`).join(', ')}
					</span>
				)}
			</div>
		</div>
	);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HttpSection() {
	// auth
	const [token, setToken] = useState<string | null>(null);

	// connectivity
	const [pingLoading, setPingLoading] = useState<string | null>(null);
	const [pingResult,  setPingResult]  = useState<HttpResult>(null);

	// rate limit burst
	const [burstCount,   setBurstCount]   = useState<number>(30);
	const [burstMode,    setBurstMode]    = useState<BurstMode>('auth');
	const [burstLoading, setBurstLoading] = useState(false);
	const [burstResult,  setBurstResult]  = useState<RateLimitBurstResult | null>(null);
	// bucket refill countdown
	const [refillAt, setRefillAt] = useState<number | null>(null);
	const [secsLeft, setSecsLeft] = useState<number>(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!refillAt) return;
		const deadline = refillAt;
		function tick() {
			const s = Math.ceil((deadline - Date.now()) / 1000);
			if (s <= 0) {
				setSecsLeft(0);
				if (timerRef.current) clearInterval(timerRef.current);
			} else {
				setSecsLeft(s);
			}
		}
		tick();
		timerRef.current = setInterval(tick, 1000);
		return () => { if (timerRef.current) clearInterval(timerRef.current); };
	}, [refillAt]);

	async function runPing(label: string, fn: () => Promise<HttpResult>) {
		setPingLoading(label);
		setPingResult(null);
		try {
			setPingResult(await fn());
		} finally {
			setPingLoading(null);
		}
	}

	async function runBurst() {
		setBurstLoading(true);
		setBurstResult(null);
		try {
			const res = await rateLimitBurst(burstCount, burstMode, token ?? undefined);
			setBurstResult(res);
			setRefillAt(Date.now() + 60_000);
			setSecsLeft(60);
		} finally {
			setBurstLoading(false);
		}
	}

	const anyLoading = pingLoading !== null || burstLoading;
	const activeModeDesc = BURST_MODES.find(m => m.value === burstMode)?.desc ?? '';

	return (
<section className="flex flex-col gap-5">

			{/* ── Section title ── */}
			<div className="flex items-center gap-3">
				<span className="text-xs font-mono uppercase tracking-widest text-orange-400">
					HTTP / REST
				</span>
				<div className="flex-1 h-px bg-slate-700" />
			</div>

			{/* ── Auth ── */}
			<div className="flex flex-col gap-2">
				<SubHeader label="Auth" />
				<AuthSection token={token} onToken={setToken} />
			</div>

			{/* ── Connectivity ── */}
			<div className="flex flex-col gap-2">
				<SubHeader label="Connectivity" />

				<div className="grid grid-cols-1 gap-2">
					{pingButtons(token).map(({ label, desc, fn }) => (
<button
							key={label}
							disabled={anyLoading}
							onClick={() => runPing(label, fn)}
							className="flex items-center justify-between px-4 py-3 rounded-lg
bg-slate-800 border border-slate-700 hover:border-orange-600
hover:bg-slate-750 transition disabled:opacity-50
disabled:cursor-not-allowed group text-left"
						>
							<div>
								<p className="text-sm font-semibold text-white group-hover:text-orange-300 transition">
									{label}
								</p>
								<p className="text-xs text-slate-500 mt-0.5">{desc}</p>
							</div>
							{pingLoading === label ? (
<span className="text-xs text-orange-400 animate-pulse">sending…</span>
							) : (
<span className="text-xs text-slate-600 group-hover:text-orange-500 transition">→</span>
							)}
						</button>
					))}
				</div>

				{pingResult ? (
<pre className="p-3 bg-black/60 rounded-lg border border-slate-700 text-xs
text-green-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all">
						{JSON.stringify(pingResult, null, 2)}
					</pre>
				) : (
<div className="flex items-center justify-center h-16 rounded-lg
border border-dashed border-slate-800 text-slate-700 text-xs">
						run a request to see the response
					</div>
				)}
			</div>

			{/* ── Rate Limiting ── */}
			<div className="flex flex-col gap-2">
				<SubHeader label="Rate Limiting" />

				{/* Mode selector */}
				<div className="flex gap-1">
					{BURST_MODES.map(m => (
<button
							key={m.value}
							onClick={() => { setBurstMode(m.value); setBurstResult(null); }}
							className={`px-3 py-1 rounded text-xs font-mono transition border
								${burstMode === m.value
? 'bg-orange-600 border-orange-500 text-white'
: 'bg-slate-800 border-slate-700 text-slate-400 hover:border-orange-600 hover:text-orange-300'
}`}
						>
							{m.label}
						</button>
					))}
				</div>
				<p className="text-[10px] text-slate-600 font-mono leading-relaxed">
					{activeModeDesc}
				</p>

				{/* Count selector + burst button */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-slate-500 shrink-0">Burst:</span>
					<div className="flex gap-1">
						{BURST_COUNTS.map(n => (
<button
								key={n}
								onClick={() => setBurstCount(n)}
								className={`px-3 py-1 rounded text-xs font-mono transition border
									${burstCount === n
? 'bg-slate-600 border-slate-500 text-white'
: 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
}`}
							>
								{n}×
							</button>
						))}
					</div>
					<button
						disabled={anyLoading}
						onClick={runBurst}
						className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
bg-slate-800 border border-slate-700 hover:border-orange-600 hover:text-orange-300
text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{burstLoading ? (
<>
								<span className="animate-spin text-orange-400">⟳</span>
								<span className="text-orange-400 text-xs">firing {burstCount} reqs…</span>
							</>
						) : (
<>
								<span className="text-orange-500">⚡</span>
								Fire Burst
							</>
						)}
					</button>
				</div>

				<div className="flex items-center justify-between">
					<p className="text-[10px] text-slate-600 font-mono">
						{burstCount} parallel requests to /api/ping — limit: 60 req / 60 s
					</p>
					{refillAt && (
						<span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors
							${secsLeft > 0
								? 'text-yellow-400 border-yellow-800 bg-yellow-950/40'
								: 'text-green-400 border-green-800 bg-green-950/40'
							}`}>
							{secsLeft > 0 ? `⏱ refills in ${secsLeft}s` : '✓ bucket refilled'}
						</span>
					)}
				</div>

				{burstResult ? (
<RateLimitResultCard r={burstResult} />
				) : (
<div className="flex items-center justify-center h-16 rounded-lg
border border-dashed border-slate-800 text-slate-700 text-xs">
						fire a burst to see rate-limit stats
					</div>
				)}
			</div>

		</section>
	);
}
