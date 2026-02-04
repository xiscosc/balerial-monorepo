import { dev } from '$app/environment';
import { buildPostHogServer } from '@/server/shared/server-analytics/posthog';
import { isRedirect, type HandleServerError } from '@sveltejs/kit';

const shouldCapture = (error: unknown, status: number): boolean => {
	if (dev) return false;
	if (isRedirect(error)) return false;
	// Only capture 5xx errors
	if (status < 500) return false;
	return true;
};

export const handleErrorWithPostHog: HandleServerError = async ({ error, event, status }) => {
	if (!shouldCapture(error, status)) return;

	try {
		const client = buildPostHogServer();
		client.captureException(error, undefined, event);
		await client.shutdown();
	} catch (e) {
		console.error('Failed to capture exception in PostHog:', e);
	}
};
