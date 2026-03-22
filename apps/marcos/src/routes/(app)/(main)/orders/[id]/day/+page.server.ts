import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { orderService } = locals.services!;
	const order = await orderService.getOrderById(id);
	if (order == null) {
		redirect(303, '/');
	}

	return { orders: orderService.getOrdersOnSameDay(order), customer: order.customer };
}) satisfies PageServerLoad;
