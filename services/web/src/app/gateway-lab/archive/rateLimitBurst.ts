'use server';

import fs from 'fs';
import { Agent } from 'undici';

export type BurstMode = 'auth' | 'noauth' | 'mixed';

export interface BurstGroupResult {
	sent: number;
	ok: number;
	rateLimited: number;
	errors: number;
}

export interface RateLimitBurstResult {
	mode: BurstMode;
	sent: number;
	ok: number;
	rateLimited: number;
	errors: number;
	statusBreakdown: Record<string, number>;
	durationMs: number;
	/** only present for mode === 'mixed' */
	groups?: { auth: BurstGroupResult; noauth: BurstGroupResult };
}

export default async function rateLimitBurst(
count: number = 30,
mode: BurstMode = 'auth',
token?: string,
): Promise<RateLimitBurstResult> {
	const certPath   = process.env.MTLS_CRT_PATH  || '/certs/frontend.crt';
	const keyPath    = process.env.MTLS_KEY_PATH   || '/certs/frontend.key';
	const caPath     = process.env.MTLS_CA_PATH    || '/certs/internal-ca.crt';
	const gatewayUrl = process.env.GATEWAY_URL     || 'https://gateway-service:8443';
	const bearerToken = token || process.env.BACKEND_API_TOKEN || 'testfe-token';

	const dispatcher = new Agent({
connect: {
cert: fs.readFileSync(certPath),
key:  fs.readFileSync(keyPath),
ca:   fs.readFileSync(caPath),
},
});

	// Build per-request headers based on mode
	// mixed: even indices get auth, odd indices get no auth
	function headersFor(i: number): Record<string, string> {
		const withAuth = mode === 'auth' || (mode === 'mixed' && i % 2 === 0);
		return withAuth ? { Authorization: `Bearer ${bearerToken}` } : {};
	}

	const t0 = Date.now();

	const results = await Promise.all(
Array.from({ length: count }, (_, i) =>
			(fetch(`${gatewayUrl}/api/ping`, {
// @ts-ignore — undici dispatcher, not in web fetch spec
dispatcher,
cache: 'no-store',
headers: headersFor(i),
} as any) as Promise<Response>)
				.then(r  => ({ index: i, status: r.status }))
				.catch((e: Error) => ({ index: i, status: 0, error: e.message })),
		),
	);

	const durationMs = Date.now() - t0;

	const statusBreakdown: Record<string, number> = {};
	for (const r of results) {
		const key = String(r.status);
		statusBreakdown[key] = (statusBreakdown[key] ?? 0) + 1;
	}

	const base: RateLimitBurstResult = {
		mode,
		sent:        count,
		ok:          results.filter(r => r.status === 200).length,
		rateLimited: results.filter(r => r.status === 429).length,
		errors:      results.filter(r => r.status === 0).length,
		statusBreakdown,
		durationMs,
	};

	if (mode === 'mixed') {
		const authResults   = results.filter(r => r.index % 2 === 0);
		const noauthResults = results.filter(r => r.index % 2 !== 0);
		base.groups = {
			auth: {
				sent:        authResults.length,
				ok:          authResults.filter(r => r.status === 200).length,
				rateLimited: authResults.filter(r => r.status === 429).length,
				errors:      authResults.filter(r => r.status === 0).length,
			},
			noauth: {
				sent:        noauthResults.length,
				ok:          noauthResults.filter(r => r.status === 200).length,
				rateLimited: noauthResults.filter(r => r.status === 429).length,
				errors:      noauthResults.filter(r => r.status === 0).length,
			},
		};
	}

	return base;
}
