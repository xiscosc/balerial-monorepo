import { AuthService } from '@/server/service/auth.service';
import { OrderService } from '@marcsimolduressonsardina/core/service';
import { type Order, OrderStatus } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';
import { BatchOperation } from '@/type/api.type';

async function setOrdersPaid(orders: Order[], orderService: OrderService) {
	const promises = orders.map((order) => orderService.setOrderFullyPaid(order));
	await Promise.all(promises);
}

async function setOrdersInvoiced(orders: Order[], orderService: OrderService) {
	const promises = orders.map((order) => orderService.setOrderInvoiced(order, true));
	await Promise.all(promises);
}

async function setOrdersPickedUp(orders: Order[], orderService: OrderService) {
	const promises = orders.map((order) => orderService.setOrderStatus(order, OrderStatus.PICKED_UP));
	await Promise.all(promises);
}

async function notifyOrders(orders: Order[], orderService: OrderService) {
	const promises = orders.map((order) => orderService.setOrderAsNotified(order));
	await Promise.all(promises);
}

export async function PATCH({ request, locals }) {
	const orderService = new OrderService(AuthService.generateConfiguration(locals.user!));
	const { orderIds, operations } = (await request.json()) as {
		orderIds: string[];
		operations: BatchOperation[];
	};

	const operationSet = new Set(operations);
	if (operationSet.size === 0) {
		return json({ error: 'No operations provided' }, { status: 400 });
	}

	if (orderIds.length === 0) {
		return json({ error: 'No order IDs provided' }, { status: 400 });
	}

	const orders = await orderService.getOrdersByIds(orderIds);
	const promises: Promise<void>[] = [];

	if (operationSet.has(BatchOperation.SET_PAID)) {
		promises.push(setOrdersPaid(orders, orderService));
	}

	if (operationSet.has(BatchOperation.SET_INVOICED)) {
		promises.push(setOrdersInvoiced(orders, orderService));
	}

	if (operationSet.has(BatchOperation.SET_PICKED_UP)) {
		promises.push(setOrdersPickedUp(orders, orderService));
	}

	if (operationSet.has(BatchOperation.NOTIFY_ORDERS)) {
		promises.push(notifyOrders(orders, orderService));
	}

	await Promise.all(promises);
	return json({ status: 'ok' });
}
