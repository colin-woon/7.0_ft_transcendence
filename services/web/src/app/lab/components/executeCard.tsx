import LabButton from './labButton';

// type ExecuteCardProps = {
// 	type: string;
// 	title: string;
// 	desc?: string;
// };

export default function ExecuteCard() {
	return (
		<div className="flex h-full min-w-64 flex-col gap-3">
			<div className="group relative flex h-full flex-col border border-slate-700/70 bg-slate-950/70 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950">
				<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-300/25 to-transparent opacity-70"></div>
				<div className="relative z-10">
					<div className="flex items-center justify-between gap-3">
						<span className="inline-flex border border-indigo-400/30 bg-indigo-400/12 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
							Run
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
							Manual
						</span>
					</div>
					<h3 className="mt-5 font-headline text-2xl font-black uppercase leading-none tracking-tight text-slate-50">
						Execute Scenario
					</h3>
					<p className="mt-3 text-sm leading-6 text-slate-400">
						Run the current lab configuration and print the response
						body to the log box below.
					</p>
					<div className="mt-6 border-t border-slate-800 pt-4">
						<div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
							<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
								Action
							</p>
							<div className="mt-3">
								<LabButton label="Execute" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
