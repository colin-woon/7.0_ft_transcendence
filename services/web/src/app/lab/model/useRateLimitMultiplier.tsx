import { useLabContext } from '../context/labContext';

export default function useRateLimitMultiplier() {
	const { labState, setRateLimit } = useLabContext();

	function update(n: number) {
		const value = Math.max(1, Math.min(100, n));

		setRateLimit(value);
	}

	return [labState.rateLimit, update] as const;
}
