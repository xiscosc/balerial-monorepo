import type { HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { queueError } from '@/shared/fronted-analytics/offline-error-queue';

const shouldCapture = (status: number): boolean => {
	if (dev) return false;
	// Only capture 5xx errors
	if (status < 500) return false;
	return true;
};

export const handleClientErrorWithPostHog: HandleClientError = async ({ error, status }) => {
	if (!shouldCapture(status)) return;
	const errorToTrack = error instanceof Error ? error : new Error(String(error));
	queueError(errorToTrack);
};
