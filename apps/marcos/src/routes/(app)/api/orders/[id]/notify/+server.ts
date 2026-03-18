import { ServerTracking } from '@/server/shared/tracking';
import { OrderService } from '@marcsimolduressonsardina/core/service';
import { json } from '@sveltejs/kit';

export async function GET({ locals, params }) {
	const { id } = params;
	const orderService = new OrderService(locals.config!);
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
}
