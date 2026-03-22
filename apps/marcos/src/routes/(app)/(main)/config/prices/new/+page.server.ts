import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { listPriceSchemaNew } from '@/shared/form-schema/pricing.form-schema';
import { PricingUtilites } from '@marcsimolduressonsardina/core/util';
import type {
	MaxArea,
	MaxAreaM2,
	PricingFormula,
	PricingType
} from '@marcsimolduressonsardina/core/type';
import { InvalidKeyError } from '@marcsimolduressonsardina/core/error';
import type { PageServerLoad, Actions } from './$types';
import { ServerTracking } from '@/server/shared/tracking';

export const load = (async () => {
	const form = await superValidate(zod4(listPriceSchemaNew));
	return { form };
}) satisfies PageServerLoad;

export const actions = {
	async createOrEdit({ request, locals }) {
		const form = await superValidate(request, zod4(listPriceSchemaNew));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { pricingService } = locals.services!;
		try {
			const { price, maxD1, maxD2, areas, areasM2 } = PricingUtilites.cleanFormValues(
				form as unknown as {
					data: {
						formula: PricingFormula;
						areas: MaxArea[];
						areasM2: MaxAreaM2[];
						price: number;
						maxD1: number;
						maxD2: number;
					};
				}
			);

			await pricingService.createPricing(
				form.data.id,
				price,
				form.data.minPrice,
				form.data.discountAllowed,
				form.data.description,
				form.data.type as PricingType,
				form.data.formula,
				areas,
				areasM2,
				form.data.priority,
				maxD1,
				maxD2
			);
		} catch (error: unknown) {
			if (error instanceof InvalidKeyError) {
				return setError(form, 'id', 'Id already in use');
			}
			return setError(form, '', 'Error creando el item. Intente de nuevo.');
		}

		await ServerTracking.event('price_created', {
			user: locals.user!,
			context: locals.trackingContext,
			properties: {
				type: form.data.type,
				id: form.data.id
			}
		});

		redirect(302, `/config/prices/list?type=${form.data.type}`);
	}
} satisfies Actions;
