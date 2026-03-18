import type { RequestHandler } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { id } = params;
	const { orderService } = locals.services!;
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	await orderService.setOrderAsNotified(order);

	await ServerTracking.event('order_notified', {
		user: locals.user!,
		context: locals.trackingContext,
		orderId: id
	});

	return json({ success: true });
};
