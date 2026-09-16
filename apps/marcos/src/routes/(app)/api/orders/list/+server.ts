import type { RequestHandler } from './$types';
import { AuthService } from '@/server/service/auth.service';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import { tempCustomerUuid } from '@marcsimolduressonsardina/core/util';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!AuthService.isAdmin(locals.user)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const { orderService } = locals.services!;
	const {
		lastKey,
		status,
		descendent = true,
		unlinkedOnly = false
	} = (await request.json()) as {
		lastKey?: Record<string, string | number>;
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

	const paginatedOrders = await orderService.getOrdersByStatusPaginated(
		status,
		lastKey,
		descendent,
		unlinkedOnly ? tempCustomerUuid : undefined
	);
	return json({ orders: paginatedOrders.orders, nextKey: paginatedOrders.nextKey });
};
