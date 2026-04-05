import { useState } from 'react';

export default function useRateLimitMultiplier(initialValue = 1) {
	const [value, setValue] = useState(initialValue);

	function update(nextValue: number) {
		if (nextValue < 1) {
			nextValue = 1;
		} else if (nextValue > 100) {
			nextValue = 100;
		}

		setValue(nextValue);
	}

	return [value, update] as const;
}
