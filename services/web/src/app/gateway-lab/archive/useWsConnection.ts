'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogEntry, WsStatus } from './types';
import { now } from './constants';

export interface WsConnectionHandle {
	status: WsStatus;
	log: LogEntry[];
	logEndRef: React.RefObject<HTMLDivElement | null>;
	wsRef: React.RefObject<WebSocket | null>;
	isConnected: boolean;
	isDisconnected: boolean;
	addLog: (kind: LogEntry['kind'], text: string) => void;
	connect: (url: string) => void;
	disconnect: () => void;
	sendMessage: (msg: string) => void;
	clearLog: () => void;
}

export function useWsConnection(): WsConnectionHandle {
	const [status, setStatus] = useState<WsStatus>('disconnected');
	const [log, setLog] = useState<LogEntry[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	const logEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [log]);

	function addLog(kind: LogEntry['kind'], text: string) {
		setLog((prev) => [...prev, { ts: now(), kind, text }]);
	}

	function connect(url: string) {
		if (wsRef.current) disconnect();

		addLog('info', `connecting → ${url}`);
		setStatus('connecting');

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			setStatus('connected');
			addLog('info', 'WebSocket open — waiting for auth…');
		};

		ws.onmessage = (e) => {
			try {
				const parsed = JSON.parse(e.data);
				if (parsed.type === 'authenticated') {
					addLog('info', `authenticated — userId: ${parsed.userId}`);
					return;
				}
			} catch {
				// not JSON, fall through
			}
			addLog('recv', e.data);
		};

		ws.onerror = () => {
			setStatus('error');
			addLog('error', 'WebSocket error');
		};

		ws.onclose = (e) => {
			wsRef.current = null;
			setStatus('disconnected');
			addLog(
				e.wasClean ? 'warn' : 'error',
				`closed — code ${e.code}${e.reason ? ` · ${e.reason}` : ''}`,
			);
		};
	}

	function disconnect() {
		wsRef.current?.close(1000, 'manual disconnect');
		wsRef.current = null;
		setStatus('disconnected');
		addLog('info', 'disconnected by user');
	}

	function sendMessage(msg: string) {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !msg.trim()) return;
		wsRef.current.send(msg.trim());
		addLog('sent', msg.trim());
	}

	function clearLog() {
		setLog([]);
	}

	const isConnected = status === 'connected';
	const isDisconnected = status === 'disconnected' || status === 'error';

	return {
		status,
		log,
		logEndRef,
		wsRef,
		isConnected,
		isDisconnected,
		addLog,
		connect,
		disconnect,
		sendMessage,
		clearLog,
	};
}
