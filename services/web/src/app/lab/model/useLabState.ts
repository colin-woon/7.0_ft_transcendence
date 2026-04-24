import { useState } from 'react';
import { labRoutes } from './routes';
import getLabBodyTemplate from './getLabBodyTemplate';
import type { LabState } from '../types';

const defaultLabState: LabState = {
	userType: 'Guest',
	service: 'Auth',
	endpoint: '/health',
	method: 'GET',
	body: getLabBodyTemplate('GET', 'Auth', '/health'),
	rateLimit: 1,

	result: null,
	execRun: false,
	execError: false,
};

export function useLabState() {
	const [labState, setLabState] = useState<LabState>(defaultLabState);

	return {
		labState,
		setUserType: (userType: LabState['userType']) =>
			setLabState((prev) => ({ ...prev, userType })),
		setService: (service: LabState['service']) =>
			setLabState((prev) => {
				const nextEndpoint =
					labRoutes[service].endpoints[0] ?? prev.endpoint;

				return {
					...prev,
					service,
					endpoint: nextEndpoint,
					body: getLabBodyTemplate(prev.method, service, nextEndpoint),
				};
			}),
		setEndpoint: (endpoint: LabState['endpoint']) =>
			setLabState((prev) => ({
				...prev,
				endpoint,
				body: getLabBodyTemplate(prev.method, prev.service, endpoint),
			})),
		setMethod: (method: LabState['method']) =>
			setLabState((prev) => ({
				...prev,
				method,
				body: getLabBodyTemplate(method, prev.service, prev.endpoint),
			})),
		setBody: (body: LabState['body']) =>
			setLabState((prev) => ({ ...prev, body })),
		setRateLimit: (rateLimit: LabState['rateLimit']) =>
			setLabState((prev) => ({ ...prev, rateLimit })),
		setResult: (result: LabState['result']) =>
			setLabState((prev) => ({ ...prev, result })),
		setExecRun: (execRun: LabState['execRun']) =>
			setLabState((prev) => ({ ...prev, execRun })),
		setExecError: (execError: LabState['execError']) =>
			setLabState((prev) => ({ ...prev, execError })),
	};
}
