import useRateLimitMultiplier from '../model/useRateLimitMultiplier';

type RateLimitCardProps = {
	type: string;
	title: string;
	desc?: string;
};

export default function RateLimitCard({
	type,
	title,
	desc,
}: RateLimitCardProps) {
	const [multiplier, setMultiplier] = useRateLimitMultiplier();

	return (
		<div className="flex flex-col gap-3">
			<div className="group relative flex h-full flex-col border border-slate-700/70 bg-slate-950/70 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950">
				<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-300/25 to-transparent opacity-70"></div>
				<div className="relative z-10">
					<div className="flex items-center justify-between gap-3">
						<span className="inline-flex border border-indigo-400/30 bg-indigo-400/12 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
							{type || 'Component / Dynamic_Hover'}
						</span>
						<span className="material-symbols-outlined text-sm text-indigo-300">
							bolt_boost
						</span>
					</div>
					<h3 className="mt-5 font-headline text-3xl font-black leading-none tracking-tighter text-slate-50">
						{title || 'Dynamic Hover Card'}
					</h3>
					<p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
						{desc ||
							'An interactive card component that responds to hover with dynamic content and layered visuals.'}
					</p>
					<div className="mt-6 border-t border-slate-800 pt-4">
						<div className="mb-3 flex items-center justify-between gap-4">
							<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
								burst multiplier
							</p>
							<span className="inline-flex min-w-16 justify-center border border-indigo-400/30 bg-indigo-400/12 px-3 py-1 font-mono text-sm font-bold text-indigo-300">
								{multiplier}x
							</span>
						</div>
						<input
							type="range"
							min="1"
							max="100"
							value={multiplier}
							onChange={(e) =>
								setMultiplier(Number(e.target.value))
							}
							className="h-2 w-full cursor-pointer appearance-auto rounded-full bg-slate-800 accent-indigo-400"
						/>
						<div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
							<span>1x</span>
							<span>100x</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
