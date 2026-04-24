import type { LabMethod, LabService } from '../types';

const CHAT_MESSAGE_MAX_BYTES = 5 * 1024;

function buildPrettyJson(value: unknown) {
	return JSON.stringify(value, null, 2);
}

function buildNear5KbChatBody(service: LabService, endpoint: string) {
	const payload = {
		name: '42Overflow Lab',
		note: 'Chat 5KB message limit template.',
		payload: {
			service: service.toLowerCase(),
			endpoint,
			content: '',
		},
	};

	const baseSize = buildPrettyJson(payload).length;
	const contentBudget = Math.max(0, CHAT_MESSAGE_MAX_BYTES - baseSize - 16);
	payload.payload.content = 'x'.repeat(contentBudget);

	return buildPrettyJson(payload);
}

export default function getLabBodyTemplate(
	method: LabMethod,
	service: LabService,
	endpoint: string
) {
	if (method === 'GET' || method === 'DELETE') {
		return '';
	}

	if (
		(service === 'Chat' && endpoint.startsWith('/message')) ||
		(service === 'Gateway' && endpoint === '/testbody')
	) {
		return buildNear5KbChatBody(service, endpoint);
	}

	return buildPrettyJson({
		name: '42Overflow Lab',
		payload: {
			service: service.toLowerCase(),
			endpoint,
			content: 'Editable request body template.',
		},
	});
}
