import type { LabRequestConfig, LabState } from '../types';

export default function buildLabRequest(labState: LabState): LabRequestConfig {
	const url = '/' + labState.service.toLowerCase() + labState.endpoint;
	const isAuth = labState.userType !== 'Guest';

	return {
		method: labState.method,
		url,
		isAuth,
		body: labState.body,
		rateLimit: labState.rateLimit,
	};
}
