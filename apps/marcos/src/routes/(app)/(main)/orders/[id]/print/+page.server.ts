import type { PageServerLoad } from './$types';
import { ENV_NAME } from '$env/static/private';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { orderService } = locals.services!;
	const fullOrder = orderService.getFullOrderById(id);

	return {
		fullOrder,
		user: locals.user!,
		envName: ENV_NAME
	};
}) satisfies PageServerLoad;
