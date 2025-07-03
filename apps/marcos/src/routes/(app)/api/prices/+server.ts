import type { PreCalculatedItemPartRequest } from '@/type/api.type';
import { json } from '@sveltejs/kit';
import { AuthService } from '@/server/service/auth.service';
import { InvalidSizeError } from '@marcsimolduressonsardina/core/error';
import { CalculatedItemService, PricingService } from '@marcsimolduressonsardina/core/service';
import type {
	PreCalculatedItemPart,
	CalculatedItemPart,
	OrderDimensions
} from '@marcsimolduressonsardina/core/type';

export async function POST({ request, locals }) {
	const pricingRequest = (await request.json()) as PreCalculatedItemPartRequest;

	try {
		const config = AuthService.generateConfiguration(locals.user!);
		const calculatedItemService = new CalculatedItemService(
			config,
			new PricingService(config, pricingRequest.markup)
		);
		const parts = await Promise.all(
			pricingRequest.partsToCalculateWithKey.map(({ key, part }) =>
				calculatePart(part, key, pricingRequest.orderDimensions, calculatedItemService)
			)
		);
		return json(parts);
	} catch (error: unknown) {
		if (error instanceof InvalidSizeError) {
			return json({ error: error.message }, { status: 400 });
		}

		return json({ error: 'Error computing the price' }, { status: 500 });
	}
}

async function calculatePart(
	partToCalculate: PreCalculatedItemPart,
	key: string,
	orderDimensions: OrderDimensions,
	calculatedItemService: CalculatedItemService
): Promise<{ part?: CalculatedItemPart; key: string; errorMessage: string | undefined }> {
	try {
		const part = await calculatedItemService.calculatePart(partToCalculate, orderDimensions);
		return { part, key, errorMessage: undefined };
	} catch (error: unknown) {
		return {
			part: undefined,
			key,
			errorMessage: error instanceof InvalidSizeError ? error.message : 'Error calculando el precio'
		};
	}
}
