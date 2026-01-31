import { APP_VERSION } from '@/shared/version/version.const';
import type { Handle } from '@sveltejs/kit';

export const versionHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('x-deployment-id', APP_VERSION);
	return response;
};
