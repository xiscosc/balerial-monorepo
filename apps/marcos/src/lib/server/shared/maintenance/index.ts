import { redirect, type Handle } from '@sveltejs/kit';
import { MAINTENANCE_MODE } from '$env/static/private';

export const maintenanceEnabled = MAINTENANCE_MODE === 'true';

export const maintenanceHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/maintenance') {
		return resolve(event);
	}

	if (maintenanceEnabled) {
		redirect(307, '/maintenance');
	}

	return resolve(event);
};
