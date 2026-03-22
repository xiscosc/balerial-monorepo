import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { customerService } = locals.services!;
	const { query } = (await request.json()) as { query: string };
	const customers = await customerService.searchCustomers(query);
	return json({ customers });
};
