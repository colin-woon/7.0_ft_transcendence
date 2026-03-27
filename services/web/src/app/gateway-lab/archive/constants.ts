import type { LogEntry, WsStatus } from './types';

export function now(): string {
	return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export const STATUS_STYLE: Record<WsStatus, string> = {
	disconnected: 'bg-slate-600 text-slate-300',
	connecting: 'bg-yellow-600 text-yellow-100 animate-pulse',
	connected: 'bg-green-700 text-green-100',
	error: 'bg-red-700 text-red-100',
};

export const STATUS_DOT: Record<WsStatus, string> = {
	disconnected: 'bg-slate-400',
	connecting: 'bg-yellow-400',
	connected: 'bg-green-400',
	error: 'bg-red-400',
};

export const LOG_STYLE: Record<LogEntry['kind'], string> = {
	info: 'text-slate-400',
	sent: 'text-sky-400',
	recv: 'text-green-400',
	warn: 'text-yellow-400',
	error: 'text-red-400',
};

export const LOG_PREFIX: Record<LogEntry['kind'], string> = {
	info: '·',
	sent: '↑',
	recv: '↓',
	warn: '!',
	error: '✕',
};
