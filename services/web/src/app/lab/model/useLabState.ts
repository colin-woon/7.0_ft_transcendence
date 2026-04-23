import { useState } from 'react';
import type { LabState } from '../types';

const defaultLabState: LabState = {
	userType: 'Guest',
	service: 'Auth',
	endpoint: '/health',
	method: 'GET',
	body: '',
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
			setLabState((prev) => ({ ...prev, service })),
		setEndpoint: (endpoint: LabState['endpoint']) =>
			setLabState((prev) => ({ ...prev, endpoint })),
		setMethod: (method: LabState['method']) =>
			setLabState((prev) => ({ ...prev, method })),
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
