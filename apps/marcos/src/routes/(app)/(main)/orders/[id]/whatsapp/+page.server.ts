import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { orderService } = locals.services!;
	const order = await orderService.getOrderById(id);

	if (order == null) {
		return fail(404, { missing: true });
	}

	const orderCounters = await orderService.getOrdersCountOnSameDay(order);

	return { order, orderCounters };
}) satisfies PageServerLoad;
