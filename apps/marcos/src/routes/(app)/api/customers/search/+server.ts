import { CustomerService } from '@marcsimolduressonsardina/core/service';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	const customerService = new CustomerService(locals.config!);
	const { query } = (await request.json()) as { query: string };
	const customers = await customerService.searchCustomers(query);
	return json({ customers });
}
