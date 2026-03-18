import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { orderSetService } = locals.services!;
	const orderSet = await orderSetService.getOrderSetById(id);

	return { orderSet };
}) satisfies PageServerLoad;
