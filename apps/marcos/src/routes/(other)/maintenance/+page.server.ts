import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { ServerFeature } from '@/server/shared/tracking/server.features';

export const load = (async ({ locals }) => {
	const maintenanceEnabled = await ServerTracking.isFeatureEnabled(ServerFeature.MAINTENANCE_MODE, {
		context: locals.trackingContext
	});
	if (!maintenanceEnabled) {
		redirect(307, '/');
	}
}) satisfies PageServerLoad;
