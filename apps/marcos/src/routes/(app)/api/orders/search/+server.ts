import { OrderService } from '@marcsimolduressonsardina/core/service';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const orderService = new OrderService(locals.config!);
	const { query, status } = (await request.json()) as { query: string; status: OrderStatus };
	const allowedStatus = [OrderStatus.QUOTE, OrderStatus.PENDING, OrderStatus.FINISHED];
	if (allowedStatus.indexOf(status) === -1) {
		return json({ error: 'Invalid status' }, { status: 400 });
	}
	const orders = await orderService.findOrdersByStatus(status, query);
	return json({ results: orders });
}
