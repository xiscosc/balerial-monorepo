import { AuthService } from '@/server/service/auth.service';
import type { CustomSession } from '@/type/api.type';
import { OrderService } from '@marcsimolduressonsardina/core/service';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const session = await locals.auth();
	const appUser = AuthService.generateUserFromAuth(session as CustomSession);
	if (!appUser) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!appUser.priceManager) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const orderService = new OrderService(AuthService.generateConfiguration(appUser));
	const { lastKey, status } = (await request.json()) as {
		lastKey?: Record<string, string | number>;
		status: OrderStatus;
	};

	const allowedStatus = [OrderStatus.QUOTE, OrderStatus.PENDING, OrderStatus.FINISHED];
	if (allowedStatus.indexOf(status) === -1) {
		return json({ error: 'Invalid status' }, { status: 400 });
	}

	const paginatedOrders = await orderService.getOrdersByStatusPaginated(status, lastKey);
	return json({ orders: paginatedOrders.orders, nextKey: paginatedOrders.nextKey });
}
