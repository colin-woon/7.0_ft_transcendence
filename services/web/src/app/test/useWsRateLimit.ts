'use client';

import { useState } from 'react';
import type { LogEntry } from './types';

export const SPAM_BURST = 15;   // exceeds WS_MSG limit of 10/s
export const FLOOD_CYCLES = 12; // rejection expected ~cycle 10 (WS_CONN_USER: 5 cap, 0.5 tokens/s refill)

interface UseWsRateLimitParams {
	wsRef: React.RefObject<WebSocket | null>;
	addLog: (kind: LogEntry['kind'], text: string) => void;
	token: string;
}

export interface WsRateLimitHandle {
	spamMessages: () => void;
	floodConnections: () => Promise<void>;
	floodRunning: boolean;
}

export function useWsRateLimit({
	wsRef,
	addLog,
	token,
}: UseWsRateLimitParams): WsRateLimitHandle {
	const [floodRunning, setFloodRunning] = useState(false);

	/** Fires SPAM_BURST messages instantly — expects throttle responses after msg 10. */
	function spamMessages() {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
		for (let i = 1; i <= SPAM_BURST; i++) {
			const text = `spam-${i}`;
			wsRef.current.send(text);
			addLog('sent', text);
		}
	}

	/**
	 * Opens FLOOD_CYCLES sequential authenticated connections.
	 * Each cycle waits for the server's `authenticated` frame before closing,
	 * ensuring the rate limit token is actually consumed on every cycle.
	 * Rejection (code 1013) expected around cycle 10.
	 */
	async function floodConnections() {
		if (!token.trim()) {
			addLog('warn', 'flood requires a token (tests per-user conn limit)');
			return;
		}

		setFloodRunning(true);
		const base = `wss://${window.location.host}/ws/chat`;
		const url = `${base}?token=${encodeURIComponent(token.trim())}`;

		for (let i = 1; i <= FLOOD_CYCLES; i++) {
			await new Promise<void>((resolve) => {
				addLog('info', `[flood ${i}/${FLOOD_CYCLES}] connecting…`);
				const ws = new WebSocket(url);
				let settled = false;

				function done() {
					if (!settled) {
						settled = true;
						setTimeout(resolve, 30);
					}
				}

				// Safety net in case auth service is unresponsive
				const timeout = setTimeout(() => {
					addLog('warn', `[flood ${i}/${FLOOD_CYCLES}] auth timed out — closing`);
					ws.close(1000, 'flood timeout');
				}, 3000);

				ws.onopen = () => {
					addLog('info', `[flood ${i}/${FLOOD_CYCLES}] open — awaiting auth confirmation…`);
				};

				ws.onmessage = (e) => {
					try {
						const parsed = JSON.parse(e.data);
						// Close only after auth confirms rate limit token was consumed
						if (parsed.type === 'authenticated') {
							clearTimeout(timeout);
							addLog('info', `[flood ${i}/${FLOOD_CYCLES}] authenticated (token consumed) — closing`);
							ws.close(1000, 'flood cycle done');
						}
					} catch {
						// ignore non-JSON
					}
				};

				ws.onclose = (e) => {
					clearTimeout(timeout);
					const label =
						e.code === 1013
							? `[flood ${i}/${FLOOD_CYCLES}] REJECTED — code ${e.code} · ${e.reason}`
							: `[flood ${i}/${FLOOD_CYCLES}] closed — code ${e.code}`;
					addLog(e.code === 1013 ? 'error' : 'warn', label);
					done();
				};

				ws.onerror = () => {
					clearTimeout(timeout);
					addLog('error', `[flood ${i}/${FLOOD_CYCLES}] socket error`);
					done();
				};
			});
		}

		addLog('info', 'flood complete');
		setFloodRunning(false);
	}

	return { spamMessages, floodConnections, floodRunning };
}
