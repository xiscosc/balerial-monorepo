import type { PageServerLoad } from './$types';
import { AuthService } from '$lib/server/service/auth.service';
import { OrderSetService } from '@marcsimolduressonsardina/core/service';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const config = AuthService.generateConfiguration(locals.user!);
	const orderSetService = new OrderSetService(config);
	const orderSet = orderSetService.getOrderSetById(id);

	return { orderSet };
}) satisfies PageServerLoad;
