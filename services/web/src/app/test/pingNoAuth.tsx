'use server';

// import https from 'https';
import fs from 'fs';

export default async function pingNoAuth() {
	try {
		if (typeof (globalThis as { File?: unknown }).File === 'undefined') {
			const { File } = await import('node:buffer');
			(globalThis as { File?: unknown }).File = File;
		}

		const { Agent } = await import('undici');

		const certPath = process.env.MTLS_CRT_PATH || '/certs/frontend.crt';
		const keyPath = process.env.MTLS_KEY_PATH || '/certs/frontend.key';
		const caPath = process.env.MTLS_CA_PATH || '/certs/internal-ca.crt';
		const gatewayUrl =
			process.env.GATEWAY_URL || 'https://gateway-service:8443';

		// NODE_EXTRA_CA_CERTS (set in compose) handles CA trust for fetch.
		// https.Agent is only needed here to attach the client cert (mTLS outgoing).
		const dispatcher = new Agent({
			connect: {
				cert: fs.readFileSync(certPath),
				key: fs.readFileSync(keyPath),
				ca: fs.readFileSync(caPath),
			},
		});

		// @ts-ignore — agent is Node.js specific, not in the web fetch spec
		const response = await fetch(`${gatewayUrl}/api/ping`, {
			dispatcher,
			cache: 'no-store',
		} as any);
		console.log(
			'Received response from backend:',
			response.status,
			response.statusText
		);

		const data = await response.json();

		console.log('Response data:', data);

		return { success: true, data };
	} catch (error: any) {
		console.error('Error in pingNoAuth:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
