type InteractiveCardProps = {
	type: string;
	title: string;
	desc?: string;
};

export default function InteractiveCard({
	type,
	title,
	desc,
}: InteractiveCardProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="group relative flex h-full flex-col border border-slate-700/70 bg-slate-950/70 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/25 to-transparent opacity-70"></div>
				<div className="relative z-10">
					<div className="flex items-center justify-between gap-3">
						<span className="inline-flex border border-indigo-400/30 bg-indigo-400/12 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
							{type || 'Component / Dynamic_Hover'}
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
							route test
						</span>
					</div>
					<h3 className="mt-5 font-headline text-3xl font-black uppercase tracking-tighter leading-none text-slate-50">
						{title || 'Dynamic Hover Card'}
					</h3>
					<p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
						{desc ||
							'An interactive card component that responds to hover with dynamic content and layered visuals.'}
					</p>
					<div className="mt-6 border-t border-slate-800 pt-4">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
							auth.gateway.lab
						</p>
					</div>
					<button className="mt-6 w-full border border-slate-700/70 bg-slate-900/80 px-4 py-3 font-headline font-bold uppercase tracking-wide text-slate-100 transition-all duration-200 hover:border-indigo-400/45 hover:bg-indigo-500 hover:text-white cursor-pointer">
						Buttons
					</button>
				</div>
			</div>
		</div>
	);
}
