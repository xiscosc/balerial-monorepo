import posthog from 'posthog-js';
import { isHttpError, type HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';

const shouldCapture = (error: unknown): boolean => {
	if (dev) return false;
	if (isHttpError(error) && error.status < 500) return false;
	return true;
};

export const handleClientErrorWithPostHog: HandleClientError = async ({ error }) => {
	if (!shouldCapture(error)) return;
	posthog.captureException(error);
};
