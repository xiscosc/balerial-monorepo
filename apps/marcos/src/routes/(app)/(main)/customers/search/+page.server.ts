import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import type { PageServerLoad, Actions } from './$types';
import { AuthService } from '$lib/server/service/auth.service';

const schema = z.object({
	phone: z.string().min(9).default('+34')
});

export const load = (async ({ locals }) => {
	const form = await superValidate(zod4(schema));
	return { form, canSeeList: AuthService.isAdmin(locals.user) };
}) satisfies PageServerLoad;

export const actions = {
	async default({ request, locals }) {
		const form = await superValidate(request, zod4(schema));

		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		const { customerService } = locals.services!;
		const existingCustomer = await customerService.getCustomerByPhone(form.data.phone);
		if (existingCustomer) {
			redirect(302, `/customers/${existingCustomer.id}`);
		}

		const ulrEscapedPhone = encodeURIComponent(form.data.phone);
		redirect(302, `/customers/new?phone=${ulrEscapedPhone}`);
	}
} satisfies Actions;
