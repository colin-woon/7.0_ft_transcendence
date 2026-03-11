import HttpSection from './HttpSection';
import WsSection from './WsSection';
import { LOG_PREFIX, LOG_STYLE } from './constants';
import type { LogEntry } from './types';

export default function TestPage() {
	return (
<div className="min-h-screen bg-slate-950 text-white p-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-white tracking-tight">
					bumIntra <span className="text-orange-400">Gateway</span> Test Console
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					mTLS · REST · WebSocket · Auth · Rate Limiting
				</p>
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
				<div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
					<HttpSection />
				</div>
				<div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
					<WsSection />
				</div>
			</div>

			{/* Legend */}
			<div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-600 max-w-6xl">
				{(Object.entries(LOG_PREFIX) as Array<[LogEntry['kind'], string]>).map(
([kind, prefix]) => (
<span key={kind} className={`font-mono ${LOG_STYLE[kind]}`}>
							{prefix} {kind}
						</span>
					),
				)}
				<span className="ml-auto">
					WS endpoint:{' '}
					<code className="font-mono text-slate-500">/ws/chat</code>
					&nbsp;&middot; token via{' '}
					<code className="font-mono text-slate-500">?token=</code>
				</span>
			</div>
		</div>
	);
}
