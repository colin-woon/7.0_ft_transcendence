export type HttpResult = Record<string, unknown> | null;

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LogEntry {
	ts: string;
	kind: 'info' | 'sent' | 'recv' | 'error' | 'warn';
	text: string;
}
