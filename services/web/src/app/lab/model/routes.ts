import { LabRouteConfig, LabService } from '../types';

export const labRoutes: Record<LabService, LabRouteConfig> = {
	Auth: { endpoints: ['/health'] },
	Forum: { endpoints: ['/health'] },
	Chat: { endpoints: ['/health'] },
	Gateway: { endpoints: ['/health'] },
	Invalid: { endpoints: ['/health'] },
};
