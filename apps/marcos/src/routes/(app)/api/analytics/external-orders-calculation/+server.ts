import { AuthService } from '@/server/service/auth.service';
import { trackServerEvent } from '@/server/shared/server-analytics/posthog';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const body = (await request.json()) as { firstTime: boolean; total: number };
	const event = body.firstTime ? 'external_order_calculated' : 'external_order_recalculated';
	AuthService.generateConfiguration(locals.user!);
	await trackServerEvent(
		locals.user!,
		{
			event,
			properties: {
				amount: body.total
			}
		},
		locals.posthog
	);
	return json({ result: 'ok' });
}
