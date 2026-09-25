import type { RequestHandler } from './$types';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import { tempCustomerUuid } from '@marcsimolduressonsardina/core/util';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { orderService } = locals.services!;
	const {
		query,
		status,
		descendent = true,
		unlinkedOnly = false
	} = (await request.json()) as {
		query: string;
		status: OrderStatus;
		descendent?: boolean;
		unlinkedOnly?: boolean;
	};
	const allowedStatus = [
		OrderStatus.QUOTE,
		OrderStatus.PENDING,
		OrderStatus.FINISHED,
		OrderStatus.PICKED_UP
	];
	if (allowedStatus.indexOf(status) === -1) {
		return json({ error: 'Invalid status' }, { status: 400 });
	}
	if (
		typeof descendent !== 'boolean' ||
		typeof unlinkedOnly !== 'boolean' ||
		(unlinkedOnly && ![OrderStatus.PENDING, OrderStatus.QUOTE].includes(status))
	) {
		return json({ error: 'Invalid filters' }, { status: 400 });
	}
	const orders = await orderService.findOrdersByStatus(
		status,
		query,
		descendent,
		unlinkedOnly ? tempCustomerUuid : undefined
	);
	return json({ results: orders });
};
