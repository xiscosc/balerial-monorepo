import type { PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { CustomerService, OrderService } from '@marcsimolduressonsardina/core/service';
import { OrderUtilities } from '@marcsimolduressonsardina/core/util';
import { ServerTracking } from '@/server/shared/tracking';

export const load = (async ({ params, locals }) => {
	const { id, customerId } = params;
	const config = locals.config!;
	const customerService = new CustomerService(config);
	const orderService = new OrderService(config, customerService);

	const customer = await customerService.getCustomerById(customerId);

	if (customer == null) {
		fail(404, { missing: true });
	}

	const order = await orderService.getOrderById(id);
	if (!order || !OrderUtilities.isOrderTemp(order)) {
		fail(404, { missing: true });
	}

	await orderService.addCustomerToTemporaryOrder(customer!, order!);
	await ServerTracking.event('order_customer_linked_from_search', {
		user: locals.user!,
		context: locals.trackingContext,
		orderId: order!.id,
		customerId: customer!.id
	});

	redirect(302, `/orders/${id}/files`);
}) satisfies PageServerLoad;
