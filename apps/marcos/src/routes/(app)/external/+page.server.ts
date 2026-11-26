import type { PageServerLoad } from './$types';
import type { AppUser } from '@marcsimolduressonsardina/contracts/type';

export const load = (async ({ locals }) => {
	const user = locals.user! as AppUser;

	return {
		storeName: user.storeId
	};
}) satisfies PageServerLoad;
