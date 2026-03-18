import { fail, error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { customerSchema } from '$lib/shared/form-schema/customer.form-schema';
import { CustomerService } from '@marcsimolduressonsardina/core/service';
import { ServerTracking } from '@/server/shared/tracking';

export const load = async ({ url }) => {
	const phone = url.searchParams.get('phone');
	const form = await superValidate(zod4(customerSchema));
	if (phone) form.data.phone = phone;
	return { form };
};

export const actions = {
	async default({ request, locals }) {
		const form = await superValidate(request, zod4(customerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const customerService = new CustomerService(locals.config!);
		const existingCustomer = await customerService.getCustomerByPhone(form.data.phone);
		if (existingCustomer) {
			redirect(302, `/customers/${existingCustomer.id}`);
		}

		const customer = await customerService.createCustomer(form.data.name, form.data.phone);
		if (customer == null) {
			return error(500, 'Error creating customer');
		}

		await ServerTracking.event('customer_created', {
			user: locals.user!,
			context: locals.trackingContext,
			customerId: customer.id
		});
		redirect(302, `/customers/${customer.id}`);
	}
};
