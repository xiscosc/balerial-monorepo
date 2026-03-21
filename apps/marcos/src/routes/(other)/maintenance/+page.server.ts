import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { maintenanceEnabled } from '@/server/shared/maintenance';

export const load = (() => {
	if (!maintenanceEnabled) {
		redirect(307, '/');
	}
}) satisfies PageServerLoad;
