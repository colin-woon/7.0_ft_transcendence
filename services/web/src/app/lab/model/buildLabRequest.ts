import type { LabRequestConfig, LabState } from '../types';

export default function buildLabRequest(labState: LabState): LabRequestConfig {
	const url = '/' + labState.service.toLowerCase() + labState.endpoint;
	const isAuth = labState.userType !== 'Guest';
	const isAdmin = labState.userType === 'Admin';

	return {
		method: labState.method,
		url,
		isAuth,
		isAdmin,
		body: labState.body,
		rateLimit: labState.rateLimit,
	};
}
