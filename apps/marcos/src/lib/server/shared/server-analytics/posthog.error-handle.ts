import { dev } from '$app/environment';
import { buildPostHogServer } from '@/server/shared/server-analytics/posthog';
import { isRedirect, isHttpError, type HandleServerError } from '@sveltejs/kit';

const client = buildPostHogServer();

const shouldCapture = (error: unknown): boolean => {
	if (dev) return false;
	if (isRedirect(error)) return false;
	if (isHttpError(error) && error.status < 500) return false;
	return true;
};

export const handleErrorWithPostHog: HandleServerError = async ({ error, event }) => {
	if (!shouldCapture(error)) return;

	try {
		client.captureException(error, undefined, event);
		await client.shutdown();
	} catch (e) {
		console.error('Failed to shutdown PostHog client:', e);
	}
};
