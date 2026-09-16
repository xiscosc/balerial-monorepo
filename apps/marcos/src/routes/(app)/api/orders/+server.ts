import type { RequestHandler } from './$types';
import { type Order, OrderStatus } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';
import { BatchOperation } from '@/type/api.type';
import { ServerTracking } from '@/server/shared/tracking';
import type { OrderService } from '@marcsimolduressonsardina/core/service';
import { OrderUtilities } from '@marcsimolduressonsardina/core/util';
import { AuthService } from '@/server/service/auth.service';

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

async function deleteOrders(orders: Order[], orderService: OrderService) {
	const promises = orders.map((order) => orderService.setOrderStatus(order, OrderStatus.DELETED));
	await Promise.all(promises);
}

async function trackBulkOperation(event: string, orderIds: string[], locals: App.Locals) {
	await ServerTracking.event(event, {
		user: locals.user!,
		context: locals.trackingContext,
		properties: { orderIds }
	});
}

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { orderService } = locals.services!;
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
	const someOrdersAreUnlinked = orders.some(OrderUtilities.isOrderTemp);
	const allOrdersAreUnlinked = orders.length > 0 && orders.every(OrderUtilities.isOrderTemp);
	if (operationSet.has(BatchOperation.DELETE) && !allOrdersAreUnlinked) {
		return json({ error: 'Only unlinked orders can be deleted in bulk' }, { status: 400 });
	}
	if (
		(operationSet.has(BatchOperation.DELETE) && operationSet.size !== 1) ||
		(someOrdersAreUnlinked && !operationSet.has(BatchOperation.DELETE))
	) {
		return json({ error: 'Invalid operations for unlinked orders' }, { status: 400 });
	}
	if (operationSet.has(BatchOperation.DELETE) && !AuthService.isAdmin(locals.user)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	const promises: Promise<void>[] = [];

	if (operationSet.has(BatchOperation.SET_PAID)) {
		promises.push(setOrdersPaid(orders, orderService));
		promises.push(trackBulkOperation('orders_bulk_set_paid', orderIds, locals));
	}

	if (operationSet.has(BatchOperation.SET_INVOICED)) {
		promises.push(setOrdersInvoiced(orders, orderService));
		promises.push(trackBulkOperation('orders_bulk_set_invoiced', orderIds, locals));
	}

	if (operationSet.has(BatchOperation.SET_PICKED_UP)) {
		promises.push(setOrdersPickedUp(orders, orderService));
		promises.push(trackBulkOperation('orders_bulk_set_picked_up', orderIds, locals));
	}

	if (operationSet.has(BatchOperation.NOTIFY_ORDERS)) {
		promises.push(notifyOrders(orders, orderService));
		promises.push(trackBulkOperation('orders_bulk_notify', orderIds, locals));
	}

	if (operationSet.has(BatchOperation.DELETE)) {
		promises.push(deleteOrders(orders, orderService));
		promises.push(trackBulkOperation('orders_bulk_delete', orderIds, locals));
	}

	await Promise.all(promises);
	return json({ status: 'ok' });
};
