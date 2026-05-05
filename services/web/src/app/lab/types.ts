export type LabUser = 'Guest' | 'User' | 'Admin';
export type LabService = 'Auth' | 'Forum' | 'Chat' | 'Gateway' | 'Invalid';
export type LabMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type LabState = {
	userType: LabUser;
	service: LabService;
	endpoint: string;
	method: LabMethod;
	body: string;
	rateLimit: number;

	result: LabRunResult | null;
	execRun: boolean;
	execError: boolean;
};

export type LabResult = {
	index: number;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	ok: boolean;
};

export type LabRunResult = {
	total: number;
	success: number;
	failure: number;
	result: LabResult[];
};

export type LabRouteConfig = {
	endpoints: string[];
};

export type LabRequestConfig = {
	method: LabMethod;
	url: string;
	isAuth: boolean;
	isAdmin: boolean;
	body: string;
	rateLimit: number;
};
