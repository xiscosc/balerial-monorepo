import posthog from 'posthog-js';
import type { HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';

const shouldCapture = (status: number): boolean => {
	if (dev) return false;
	// Only capture 5xx errors
	if (status < 500) return false;
	return true;
};

export const handleClientErrorWithPostHog: HandleClientError = async ({ error, status }) => {
	if (!shouldCapture(status)) return;
	posthog.captureException(error);
};
