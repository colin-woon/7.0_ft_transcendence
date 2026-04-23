import { useLabContext } from '../context/labContext';

export default function LogBox() {
	const sampleResponse = {
		requestId: 'lab-2f9c1d58',
		status: 200,
		method: 'POST',
		path: '/api/auth/me',
		durationMs: 12,
		body: {
			ok: true,
			message: 'Manual lab trigger completed.',
			user: {
				id: 42,
				role: 'STUDENT',
			},
		},
	};

	const { labState } = useLabContext();

	const lastResult = labState.result?.result.at(-1);

	const display = lastResult
		? JSON.stringify(
				{
					status: lastResult.status,
					statusText: lastResult.statusText,
					headers: lastResult.headers,
					body: parseJson(lastResult.body),
				},
				null,
				2
			)
		: 'No response yet.';

	function parseJson(body: string) {
		try {
			return JSON.parse(body);
		} catch (err) {
			return body;
		}
	}

	return (
		<section className="relative bottom-0 left-0 z-40 w-full overflow-hidden rounded-md border border-slate-700/70 bg-slate-950/80 shadow-2xl ring-1 ring-inset ring-indigo-300/10 backdrop-blur-sm">
			<div className="flex items-center justify-between border-b border-slate-700/70 bg-slate-900/85 px-6 py-3">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span
							className="material-symbols-outlined text-sm text-indigo-300"
							data-icon="terminal"
						>
							terminal
						</span>
						<span className="font-headline text-xs font-bold uppercase tracking-wider text-slate-100">
							Response Output
						</span>
					</div>
					<div className="h-4 w-px bg-slate-700/70"></div>
					<div className="flex items-center gap-4">
						<span className="font-mono text-[10px] text-emerald-500 flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
							Ready
						</span>
						<span className="font-mono text-[10px] text-slate-500">
							Pretty Printed JSON
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
						Read Only
					</span>
				</div>
			</div>
			{/* <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-3"> */}
			{/* 	<p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300"> */}
			{/* 		Response Body */}
			{/* 	</p> */}
			{/* 	<p className="mt-1 text-xs text-slate-500"> */}
			{/* 		Last execution result will appear here after the scenario */}
			{/* 		runs. */}
			{/* 	</p> */}
			{/* </div> */}
			<div className="bg-slate-950/90 p-4">
				<pre className="min-h-56 overflow-x-auto rounded-md border border-slate-800 bg-slate-950/70 px-4 py-4 font-mono text-[12px] leading-6 text-slate-300 console-scrollbar">
					{display}
				</pre>
			</div>
		</section>
	);
}
