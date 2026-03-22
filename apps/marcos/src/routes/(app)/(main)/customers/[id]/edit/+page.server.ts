import { superValidate, setError } from 'sveltekit-superforms';
import type { PageServerLoad, Actions } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '$lib/shared/form-schema/customer.form-schema';
import { fail, redirect } from '@sveltejs/kit';
import { InvalidKeyError } from '@marcsimolduressonsardina/core/error';
import { ServerTracking } from '@/server/shared/tracking';

export const load = (async ({ params, locals }) => {
	const { id } = params;
	const { customerService } = locals.services!;
	const customer = await customerService.getCustomerById(id);
	if (customer == null) {
		redirect(302, '/');
	}

	const form = await superValidate(zod4(customerSchema));
	form.data.phone = customer.phone;
	form.data.name = customer.name;
	return { form };
}) satisfies PageServerLoad;

export const actions = {
	async default({ request, locals, params }) {
		const { id } = params;
		const form = await superValidate(request, zod4(customerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { customerService } = locals.services!;
		const existingCustomer = await customerService.getCustomerById(id);
		if (existingCustomer == null) {
			redirect(302, '/');
		}

		try {
			await customerService.updateCustomerData(existingCustomer, form.data.name, form.data.phone);
		} catch (error) {
			if (error instanceof InvalidKeyError) {
				return setError(form, 'phone', 'Número de teléfono ya en uso');
			}
			throw fail(500);
		}

		await ServerTracking.event('customer_updated', {
			user: locals.user!,
			context: locals.trackingContext,
			customerId: existingCustomer.id
		});
		redirect(302, `/customers/${existingCustomer.id}`);
	}
} satisfies Actions;
