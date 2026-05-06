import { LabRunResult, LabResult } from '../types';
import buildLabResult from './buildLabResult';

export default async function buildLabRunResult(
	responses: Response[]
): Promise<LabRunResult> {
	const labResults: LabResult[] = await Promise.all(
		responses.map((res, idx) => buildLabResult(res, idx))
	);
	const success = labResults.filter((result) => result.ok).length;
	const failure = labResults.length - success;

	return {
		total: success + failure,
		success,
		failure,
		result: labResults,
	};
}
