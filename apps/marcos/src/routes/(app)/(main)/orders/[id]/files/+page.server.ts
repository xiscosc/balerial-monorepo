import { FileService, OrderService } from '@marcsimolduressonsardina/core/service';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const config = locals.config!;
	const fileService = new FileService(config);
	const orderService = new OrderService(config);

	const order = await orderService.getOrderById(id);

	if (order == null) {
		return fail(404, { missing: true });
	}

	const files = fileService.getFilesByOrder(order.id);
	return {
		order,
		files
	};
}) satisfies PageServerLoad;
