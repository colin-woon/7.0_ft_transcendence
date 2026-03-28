'use client';

import { useState } from 'react';
import { STATUS_DOT, STATUS_STYLE } from './constants';
import { useWsConnection } from './useWsConnection';
import { useWsRateLimit, SPAM_BURST, FLOOD_CYCLES } from './useWsRateLimit';
import WsEventLog from './WsEventLog';

export default function WsSection() {
	const [token, setToken] = useState('');
	const [message, setMessage] = useState('');

	const ws = useWsConnection();
	const rl = useWsRateLimit({ wsRef: ws.wsRef, addLog: ws.addLog, token });

	function handleConnect() {
		const base = `wss://${window.location.host}/ws/chat`;
		const url = token.trim()
			? `${base}?token=${encodeURIComponent(token.trim())}`
			: base;
		ws.connect(url);
	}

	function handleSend() {
		ws.sendMessage(message);
		setMessage('');
	}

	return (
<section className="flex flex-col gap-4">
			<div className="flex items-center gap-3 mb-1">
				<span className="text-xs font-mono uppercase tracking-widest text-orange-400">
					WebSocket / Chat
				</span>
				<div className="flex-1 h-px bg-slate-700" />
				{/* Status pill */}
				<span
					className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[ws.status]}`}
				>
					<span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ws.status]}`} />
					{ws.status}
				</span>
			</div>

			{/* Token input */}
			<input
				type="text"
				placeholder="Bearer token (leave empty to test unauthenticated)"
				value={token}
				onChange={(e) => setToken(e.target.value)}
				disabled={!ws.isDisconnected}
				className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700
text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-600
disabled:opacity-40 disabled:cursor-not-allowed font-mono"
			/>

			{/* Connect / disconnect */}
			<div className="flex gap-2">
				<button
					disabled={!ws.isDisconnected}
					onClick={handleConnect}
					className="flex-1 py-2 rounded-lg text-sm font-semibold bg-orange-600
hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					{token.trim() ? 'Connect with Auth' : 'Connect without Auth'}
				</button>
				<button
					disabled={ws.isDisconnected}
					onClick={ws.disconnect}
					className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-900/60
hover:bg-red-800 border border-red-800 disabled:opacity-40
disabled:cursor-not-allowed transition"
				>
					Disconnect
				</button>
			</div>

			{/* Rate limit tests */}
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<span className="text-xs font-mono uppercase tracking-widest text-slate-500">
						Rate Limit Tests
					</span>
					<div className="flex-1 h-px bg-slate-800" />
				</div>
				<div className="flex gap-2">
					<button
						disabled={!ws.isConnected}
						onClick={rl.spamMessages}
						title={`Sends ${SPAM_BURST} messages instantly — limit is 10/s`}
						className="flex-1 py-2 rounded-lg text-sm font-semibold bg-slate-700
hover:bg-slate-600 border border-slate-600 disabled:opacity-40
disabled:cursor-not-allowed transition"
					>
						Spam {SPAM_BURST} msgs
						<span className="ml-1.5 text-xs font-normal text-slate-400">WS_MSG</span>
					</button>
					<button
						disabled={rl.floodRunning || !token.trim()}
						onClick={rl.floodConnections}
						title={`Opens ${FLOOD_CYCLES} connections rapidly — rejection expected ~cycle 10 (WS_CONN_USER: 5 cap, 0.5/s refill)`}
						className="flex-1 py-2 rounded-lg text-sm font-semibold bg-slate-700
hover:bg-slate-600 border border-slate-600 disabled:opacity-40
disabled:cursor-not-allowed transition"
					>
						{rl.floodRunning ? (
<span className="animate-pulse">flooding…</span>
						) : (
<>
								Flood {FLOOD_CYCLES}× conns
								<span className="ml-1.5 text-xs font-normal text-slate-400">WS_CONN_USER</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Event log */}
			<WsEventLog log={ws.log} logEndRef={ws.logEndRef} onClear={ws.clearLog} />

			{/* Send message */}
			<div className="flex gap-2">
				<input
					type="text"
					placeholder={ws.isConnected ? 'type a message…' : 'connect first'}
					value={message}
					disabled={!ws.isConnected}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSend()}
					className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700
text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-600
disabled:opacity-40 disabled:cursor-not-allowed"
				/>
				<button
					disabled={!ws.isConnected || !message.trim()}
					onClick={handleSend}
					className="px-5 py-2 rounded-lg text-sm font-semibold bg-orange-600
hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
				>
					Send
				</button>
			</div>
		</section>
	);
}
