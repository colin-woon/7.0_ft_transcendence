import client from 'prom-client';

const g_metrics = globalThis as typeof globalThis & {
	metricsInitialized?: boolean;
};

if (!g_metrics.metricsInitialized) {
	client.collectDefaultMetrics();
	g_metrics.metricsInitialized = true;
}

export async function GET() {
	const metrics = await client.register.metrics();

	return new Response(metrics, {
		headers: {
			'Content-Type': client.register.contentType,
		},
	});
}
