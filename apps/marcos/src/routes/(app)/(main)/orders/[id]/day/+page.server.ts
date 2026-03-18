import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderService } from '@marcsimolduressonsardina/core/service';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const orderService = new OrderService(locals.config!);
	const order = await orderService.getOrderById(id);
	if (order == null) {
		redirect(303, '/');
	}

	return { orders: orderService.getOrdersOnSameDay(order), customer: order.customer };
}) satisfies PageServerLoad;
