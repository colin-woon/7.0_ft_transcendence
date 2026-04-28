import type { LabResult } from '../types';

export default async function buildLabResult(
	res: Response,
	index: number
): Promise<LabResult> {
	const headers = Object.fromEntries(res.headers.entries());
	const body = await res.text();
	const ok = res.ok;

	return {
		index,
		status: res.status,
		statusText: res.statusText,
		headers,
		body,
		ok,
	};
}
