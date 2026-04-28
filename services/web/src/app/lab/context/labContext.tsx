import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLabState } from '../model/useLabState';

const LabContext = createContext<ReturnType<typeof useLabState> | null>(null);

export function LabProvider({ children }: { children: ReactNode }) {
	const value = useLabState();
	return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLabContext() {
	const context = useContext(LabContext);

	if (!context) {
		throw new Error('useLabContext must be used within a LabProvider');
	}

	return context;
}
