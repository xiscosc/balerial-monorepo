import type { PageServerLoad } from './$types';
import { OrderSetService } from '@marcsimolduressonsardina/core/service';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const config = locals.config!;
	const orderSetService = new OrderSetService(config);
	const orderSet = await orderSetService.getOrderSetById(id);

	return { orderSet };
}) satisfies PageServerLoad;
