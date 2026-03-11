import type { LogEntry } from './types';
import { LOG_PREFIX, LOG_STYLE } from './constants';

interface WsEventLogProps {
	log: LogEntry[];
	logEndRef: React.RefObject<HTMLDivElement | null>;
	onClear: () => void;
}

export default function WsEventLog({ log, logEndRef, onClear }: WsEventLogProps) {
	return (
		<div className="flex flex-col">
			<div className="flex justify-between items-center mb-1.5">
				<span className="text-xs text-slate-500">event log</span>
				<button
					onClick={onClear}
					className="text-xs text-slate-600 hover:text-slate-400 transition"
				>
					clear
				</button>
			</div>
			<div className="h-56 overflow-y-auto rounded-lg bg-black/60 border border-slate-700 p-3 font-mono text-xs space-y-0.5">
				{log.length === 0 ? (
					<span className="text-slate-700">no events yet</span>
				) : (
					log.map((entry, i) => (
						<div key={i} className={`flex gap-2 ${LOG_STYLE[entry.kind]}`}>
							<span className="shrink-0 text-slate-600">{entry.ts}</span>
							<span className="shrink-0">{LOG_PREFIX[entry.kind]}</span>
							<span className="break-all">{entry.text}</span>
						</div>
					))
				)}
				<div ref={logEndRef} />
			</div>
		</div>
	);
}
