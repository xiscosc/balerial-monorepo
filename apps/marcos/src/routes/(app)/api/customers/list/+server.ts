import type { RequestHandler } from './$types';
import { AuthService } from '@/server/service/auth.service';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!AuthService.isAdmin(locals.user)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const { customerService } = locals.services!;
	const { lastKey } = (await request.json()) as { lastKey?: Record<string, string | number> };
	const customerPaginated = await customerService.getAllCustomersPaginated(lastKey);
	return json({ customers: customerPaginated.customers, lastKey: customerPaginated.nextKey });
};
