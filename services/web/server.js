const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

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
		try {
			const parsedUrl = parse(req.url, true);
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error('Error occurred handling', req.url, err);
			res.statusCode = 500;
			res.end('internal server error');
		}
	})
		.once('error', (err) => {
			console.error(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(
				`> Web Service listening at https://${hostname}:${port} as ${
					dev ? 'development' : process.env.NODE_ENV
				}`
			);
			console.log('> mTLS enabled - client certificate required');
		});
});
