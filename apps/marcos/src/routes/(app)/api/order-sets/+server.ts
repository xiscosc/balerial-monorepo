import { AuthService } from '@/server/service/auth.service';
import { trackServerEvent } from '@/server/shared/server-analytics/posthog';
import { OrderSetService } from '@marcsimolduressonsardina/core/service';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const orderSetService = new OrderSetService(AuthService.generateConfiguration(locals.user!));
	const { orderIds } = (await request.json()) as {
		orderIds: string[];
	};

	if (orderIds == null || orderIds.length === 0) {
		return json({ error: 'Invalid orderIds' }, { status: 400 });
	}

	const orderSet = await orderSetService.createOrderSet(orderIds);
	await trackServerEvent(
		locals.user!,
		{
			event: 'order_set_created',
			properties: {
				orderSetId: orderSet.id
			}
		},
		locals.posthog
	);
	return json({ orderSet });
}
