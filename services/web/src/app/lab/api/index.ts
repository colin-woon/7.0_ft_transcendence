import type { LabRequestConfig } from '../types';

export default async function runApi(
	req: LabRequestConfig
): Promise<Response[]> {
	const responses: Response[] = [];

	for (let i = 0; i < req.rateLimit; i++) {
		const res = await fetch(`/api${req.url}`, {
			method: req.method,
			headers: {
				'Content-type': 'application/json',
			},
			credentials: req.isAuth ? 'include' : 'omit',
			body:
				req.method === 'GET' || req.method === 'DELETE'
					? undefined
					: req.body,
		});

		responses.push(res);
	}

	return responses;
}
