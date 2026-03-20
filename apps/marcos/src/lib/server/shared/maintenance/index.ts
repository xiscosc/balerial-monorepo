import { redirect, type Handle } from '@sveltejs/kit';
import { ServerTracking } from '../tracking';
import { ServerFeature } from '../tracking/server.features';

export const maintenanceHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/maintenance') {
		return resolve(event);
	}

	const maintenanceEnabled = await ServerTracking.isFeatureEnabled(
		ServerFeature.MAINTENANCE_MODE,
		{ context: event.locals.trackingContext }
	);

	if (maintenanceEnabled) {
		redirect(307, '/maintenance');
	}

	return resolve(event);
};
