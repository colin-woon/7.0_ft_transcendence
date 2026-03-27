'use server';

// import https from 'https';
import fs from 'fs';
import { Agent } from 'undici';

export default async function pingNoCert() {
	try {
		// const certPath = process.env.MTLS_CRT_PATH || '/certs/frontend.crt';
		// const keyPath = process.env.MTLS_KEY_PATH || '/certs/frontend.key';
		// const caPath = process.env.MTLS_CA_PATH || '/certs/internal-ca.crt';
		const gatewayUrl =
			process.env.GATEWAY_URL || 'https://gateway-service:8443';

		// NODE_EXTRA_CA_CERTS (set in compose) handles CA trust for fetch.
		// https.Agent is only needed here to attach the client cert (mTLS outgoing).
		// const dispatcher = new Agent({
		// 	connect: {
		// 		cert: fs.readFileSync(certPath),
		// 		key: fs.readFileSync(keyPath),
		// 		ca: fs.readFileSync(caPath),
		// 	},
		// });

		// @ts-ignore — agent is Node.js specific, not in the web fetch spec
		const response = await fetch(`${gatewayUrl}/api/ping`, {
			// dispatcher,
			cache: 'no-store',
			headers: {
				Authorization: `Bearer ${process.env.BACKEND_API_TOKEN || 'testfe-token'}`,
			},
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
		console.error('Error in pingNoCert:', error);

		if (error.cause?.code === 'UND_ERR_SOCKET') {
			return {
				status: 'Rejected',
				message:
					'The gateway closed the connection (mTLS Handshake Failed as expected).',
				technical: error.cause.message,
			};
		}
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
