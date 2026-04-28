'use client';

import { LabProvider } from './context/labContext';
import LabHome from './components/labHome';

export default function LabPage() {
	return (
		<LabProvider>
			<LabHome />
		</LabProvider>
	);
}
