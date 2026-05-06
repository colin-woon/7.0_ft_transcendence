import runApi from '../api';
import { LabRunResult, LabState } from '../types';
import buildLabRequest from './buildLabRequest';
import buildLabRunResult from './buildLabRunResult';

export default async function executeLab(
	labState: LabState
): Promise<LabRunResult> {
	const req = buildLabRequest(labState);
	const res = await runApi(req);
	return buildLabRunResult(res);
}
