import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { fileService, orderService } = locals.services!;

	const order = await orderService.getOrderById(id);

	if (order == null) {
		return fail(404, { missing: true });
	}

	const files = fileService.getFilesByOrder(order.id);
	return {
		order,
		files
	};
}) satisfies PageServerLoad;
