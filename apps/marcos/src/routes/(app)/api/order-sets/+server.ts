import type { RequestHandler } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { orderSetService } = locals.services!;
	const { orderIds } = (await request.json()) as {
		orderIds: string[];
	};

	if (orderIds == null || orderIds.length === 0) {
		return json({ error: 'Invalid orderIds' }, { status: 400 });
	}

	const orderSet = await orderSetService.createOrderSet(orderIds);
	await ServerTracking.event('order_set_created', {
		user: locals.user!,
		context: locals.trackingContext,
		properties: {
			orderSetId: orderSet.id
		}
	});
	return json({ orderSet });
};
