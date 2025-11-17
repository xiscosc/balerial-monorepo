import { dev } from '$app/environment';
import { buildPostHogServer } from '@/server/shared/server-analytics/posthog';
import type { HandleServerError } from '@sveltejs/kit';

const client = buildPostHogServer();

export const handleErrorWithPostHog: HandleServerError = async ({ error, status, event }) => {
	if (status !== 404 && !dev) {
		try {
			client.captureException(error, undefined, event);
			await client.shutdown();
		} catch (e) {
			console.error('Failed to shutdown PostHog client:', e);
		}
	}
};
