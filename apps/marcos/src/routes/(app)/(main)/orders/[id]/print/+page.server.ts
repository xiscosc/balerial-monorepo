import { AuthService } from '@/server/service/auth.service';
import type { PageServerLoad } from './$types';
import { OrderService } from '@marcsimolduressonsardina/core/service';
import { ENV_NAME } from '$env/static/private';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const config = AuthService.generateConfiguration(locals.user!);
	const orderService = new OrderService(config);
	const fullOrder = orderService.getFullOrderById(id);

	return {
		fullOrder,
		user: locals.user!,
		envName: ENV_NAME
	};
}) satisfies PageServerLoad;
