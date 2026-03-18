import type { PageServerLoad } from './$types';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';

export const load = (async ({ params, locals, url }) => {
	const { id } = params;
	const showQuotes = url.searchParams.get('quotes') != null;
	const { customerService, orderService } = locals.services!;
	const customer = await customerService.getCustomerById(id);
	const orders = showQuotes
		? orderService.getOrdersByCustomerIdAndStatus(id, OrderStatus.QUOTE)
		: orderService.getOrdersByCustomerId(id);

	return { orders, customer, showQuotes };
}) satisfies PageServerLoad;
