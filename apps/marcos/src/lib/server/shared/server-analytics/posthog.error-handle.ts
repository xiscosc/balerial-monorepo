import { dev } from '$app/environment';
import { buildPostHogServer } from '@/server/shared/server-analytics/posthog';
import type { HandleServerError } from '@sveltejs/kit';

const shouldCapture = (status: number): boolean => {
	if (dev) return false;
	// Only capture 5xx errors
	if (status < 500) return false;
	return true;
};

export const handleErrorWithPostHog: HandleServerError = async ({ error, event, status }) => {
	if (!shouldCapture(status)) return;

	try {
		const client = buildPostHogServer();
		client.captureException(error, undefined, event);
		await client.shutdown();
	} catch (e) {
		console.error('Failed to capture exception in PostHog:', e);
	}
};
