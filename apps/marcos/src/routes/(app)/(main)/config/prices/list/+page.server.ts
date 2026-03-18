import type { PageServerLoad } from './$types';
import { PricingHelper } from '$lib/server/shared/pricing/pricing.helper';
import { PricingType } from '@marcsimolduressonsardina/core/type';

function getPricingType(value?: string): PricingType {
	if (!Object.values(PricingType).includes(value as PricingType) || value === PricingType.FABRIC) {
		return PricingType.MOLD;
	}

	return value as PricingType;
}

export const load = (async ({ locals, url }) => {
	const type = url.searchParams.get('type') ?? PricingType.MOLD;
	const pricingType = getPricingType(type);

	const { pricingService } = locals.services!;
	return {
		pricing: PricingHelper.getPricing(pricingService),
		pricingType
	};
}) satisfies PageServerLoad;
