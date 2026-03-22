import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const { configService } = locals.services!;
	const locations = await configService.getLocationsList();
	return { locations };
}) satisfies PageServerLoad;

export const actions: Actions = {
	saveLocations: async ({ locals, request }) => {
		const formData = await request.formData();
		const locations = formData.get('locations');
		const locationsArray = JSON.parse(locations as string) as string[];
		const { configService } = locals.services!;
		await configService.storeLocationsList(locationsArray);
		redirect(302, '/config');
	}
};
