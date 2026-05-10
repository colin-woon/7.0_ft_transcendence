const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const logNextCache = process.env.WEB_LOG_NEXT_CACHE === '1';
const debugWeb = process.env.WEB_DEBUG === '1';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const httpsOptions = {
		key: fs.readFileSync(process.env.MTLS_KEY_PATH || '/certs/web.key'),
		cert: fs.readFileSync(process.env.MTLS_CRT_PATH || '/certs/web.crt'),
		ca: fs.readFileSync(
			process.env.MTLS_CA_PATH || '/certs/ca-internal.crt'
		),
		requestCert: true,
		rejectUnauthorized: true,
	};

	createServer(httpsOptions, async (req, res) => {
		if (debugWeb) {
			console.log(`[web] -> ${req.method} ${req.url}`);
			res.on('finish', () => {
				console.log(`[web] <- ${req.method} ${req.url} ${res.statusCode}`);
			});
		}

		try {
			const parsedUrl = parse(req.url, true);
			await handle(req, res, parsedUrl);

			if (logNextCache) {
				const cacheStatus = res.getHeader('x-nextjs-cache');
				if (cacheStatus) {
					console.log(
						`[next-cache] ${req.method} ${req.url} -> ${cacheStatus}`
					);
				}
			}
		} catch (err) {
			console.log('Error occurred handling', req.url, err);
			res.statusCode = 500;
			res.end('internal server error');
		}
	})
		.once('error', (err) => {
			console.log(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(
				`> Web Service listening at https://${hostname}:${port} as ${
					dev ? 'development' : process.env.NODE_ENV
				}`
			);
			console.log('> mTLS enabled - client certificate required');
			if (debugWeb) {
				console.log('> Request debug logging enabled (WEB_DEBUG=1)');
			}
			if (logNextCache) {
				console.log('> Next cache status logging enabled (WEB_LOG_NEXT_CACHE=1)');
			}
		});
});
