import { handleClientErrorWithPostHog } from '@/shared/fronted-analytics/posthog-client.error-handle';
import { goto } from '$app/navigation';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
	try {
		const response = await originalFetch(...args);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const message = errorData.message || `HTTP Error: ${response.statusText}`;
			await goto(`/error?status=${response.status}`);
			throw new Error(message);
		}

		return response;
	} catch (e) {
		// This catches network errors (e.g., server is down).
		console.error('Network Error:', e);
		await goto('/error?status=500');
		throw new Error('Network error');
	}
};

export const handleError = handleClientErrorWithPostHog;
