import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { orderPublicIdSchema } from '@/shared/form-schema/order.form-schema';
import { OrderService } from '@marcsimolduressonsardina/core/service';
import { ServerTracking } from '@/server/shared/tracking';

export const load = async () => {
	const form = await superValidate(zod4(orderPublicIdSchema));
	return { form };
};

export const actions = {
	async default({ request, locals }) {
		const form = await superValidate(request, zod4(orderPublicIdSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const orderService = new OrderService(locals.config!);
		const orderId = await orderService.getOrderIdByPublicId(form.data.id);
		if (orderId == null) {
			return setError(form, 'id', 'No se ha encontrado el pedido');
		}

		await ServerTracking.event('order_search_by_public_id', {
			user: locals.user!,
			context: locals.trackingContext,
			orderId
		});
		redirect(303, `/orders/${orderId}`);
	}
};
