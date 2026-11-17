import { describe, expect, test } from 'bun:test';
import { InvalidSizeError } from '../../src/error';
import type { ListPriceDto } from '../../src/repository/dto/list-price.dto';
import { PricingType, type ListPrice, type PricingFormula } from '../../src/types/pricing.type';
import { CalculatedItemUtilities } from '../../src/utilities/calculated-item.utilites';
import {
	calculatedItemOf,
	deletedMolds,
	fixture,
	liveOrders,
	repriced,
	services
} from '../support';

const { pricingService, orderService, createCalculatedItemServiceWithMarkup } = services();

const fromDto = (p: ListPriceDto): ListPrice => ({
	id: p.id,
	internalId: p.uuid,
	price: p.price,
	description: p.description,
	type: p.type as PricingType,
	formula: p.formula as PricingFormula,
	areas: p.areas,
	areasM2: p.areasM2 ?? [],
	maxD1: p.maxD1,
	maxD2: p.maxD2,
	priority: p.priority ?? 0,
	minPrice: p.minPrice ?? 0,
	discountAllowed: p.discountAllowed ?? true,
	floating: p.floating ?? false
});

describe('price list page (config/prices/list via PricingHelper)', () => {
	test.each(Object.values(PricingType).filter((t) => t !== PricingType.FABRIC))(
		'%s prices are listed exactly as stored',
		async (type) => {
			const list = await pricingService.getPricingList(type);
			expect([...list].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
				fixture.LIST_PRICING_TABLE.filter((p) => p.type === type)
					.map(fromDto)
					.sort((a, b) => a.id.localeCompare(b.id))
			);
		}
	);
});

describe('price detail page (config/prices/[id])', () => {
	test('every price loads by its internal id', async () => {
		await Promise.all(
			fixture.LIST_PRICING_TABLE.map(async (dto) =>
				expect(await pricingService.getPriceListByInternalId(dto.uuid)).toEqual(fromDto(dto))
			)
		);
	}, 60_000);
});

describe('order form pricing (api/prices)', () => {
	test('every part of every real order prices as it was stored', async () => {
		const calculatedItemService = createCalculatedItemServiceWithMarkup(0);
		const checked = { same: 0, repriced: 0, deleted: 0 };

		for (const dto of liveOrders) {
			const { item } = (await orderService.getOrderById(dto.uuid))!;
			const dimensions = item.ppDimensions
				? CalculatedItemUtilities.getOrderDimensions(item.width, item.height, 0, item.ppDimensions)
				: CalculatedItemUtilities.getOrderDimensions(item.width, item.height, item.pp);
			const stored = calculatedItemOf(dto.uuid).parts;

			for (const [index, pre] of item.partsToCalculate.entries()) {
				if (deletedMolds.has(pre.id)) {
					expect(calculatedItemService.calculatePart(pre, dimensions)).rejects.toThrow(
						'Price not found'
					);
					checked.deleted++;
					continue;
				}

				const part = await calculatedItemService.calculatePart(pre, dimensions);
				const change = repriced[`${dto.uuid}|${pre.id}`];
				expect(part).toEqual({
					...stored[index]!,
					discountAllowed: stored[index]!.discountAllowed!,
					floating: stored[index]!.floating!,
					price: change?.now ?? stored[index]!.price
				});
				if (change) {
					expect(stored[index]!.price).toBe(change.stored);
					checked.repriced++;
				} else {
					checked.same++;
				}
			}
		}

		expect(checked.deleted).toBe(3);
		expect(checked.repriced).toBe(Object.keys(repriced).length);
	}, 120_000);

	test('a size above a price maximum is rejected', async () => {
		const limited = fixture.LIST_PRICING_TABLE.find(
			(p) => p.maxD1 != null && p.maxD2 != null && p.formula !== 'none' && p.type !== 'mold'
		)!;
		const order = liveOrders.find((o) => {
			const d = CalculatedItemUtilities.getOrderDimensions(o.item.width, o.item.height, o.item.pp);
			return Math.max(d.totalWidth, d.totalHeight) > Math.max(limited.maxD1!, limited.maxD2!);
		})!;
		const dimensions = CalculatedItemUtilities.getOrderDimensions(
			order.item.width,
			order.item.height,
			order.item.pp
		);
		expect(
			createCalculatedItemServiceWithMarkup(0).calculatePart(
				{ type: limited.type as PricingType, id: limited.id, quantity: 1 },
				dimensions
			)
		).rejects.toBeInstanceOf(InvalidSizeError);
	});
});
