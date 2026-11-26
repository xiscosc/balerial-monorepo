import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { utils, write } from 'xlsx';
import { MoldPriceLoader } from '../../src/data/mold-price.loader';
import { InvalidKeyError } from '../../src/error';
import {
	PricingType,
	type ListPrice,
	type PricingFormula
} from '@marcsimolduressonsardina/contracts/type';
import { config, fixture, services } from '../support';

const { pricingService } = services();

describe('new price (config/prices/new)', () => {
	test('a price copied from a real one is saved under a new id', async () => {
		const source = fixture.LIST_PRICING_TABLE.find(
			(p) => p.type === 'glass' && p.formula === 'formula_area'
		)!;
		const id = `PRECIO_${crypto.randomUUID().slice(0, 8)}`;

		await pricingService.createPricing(
			id,
			source.price,
			source.minPrice ?? 0,
			source.discountAllowed ?? true,
			source.description,
			source.type as PricingType,
			source.formula as PricingFormula,
			source.areas,
			source.areasM2,
			source.priority ?? 0,
			source.maxD1,
			source.maxD2
		);

		const created = (await pricingService.getPricingList(PricingType.GLASS)).find(
			(p) => p.id === id
		)!;
		expect(created).toMatchObject({
			price: source.price,
			description: source.description,
			formula: source.formula,
			maxD1: source.maxD1,
			maxD2: source.maxD2
		});
		expect(await pricingService.getPriceListByInternalId(created.internalId)).toEqual(created);
	});

	test('an id already used for that type is rejected', async () => {
		const existing = fixture.LIST_PRICING_TABLE.find((p) => p.type === 'back')!;
		expect(
			pricingService.createPricing(
				existing.id,
				existing.price,
				0,
				true,
				existing.description,
				PricingType.BACK,
				existing.formula as PricingFormula,
				existing.areas,
				existing.areasM2,
				0
			)
		).rejects.toBeInstanceOf(InvalidKeyError);
	});
});

describe('edit and delete price (config/prices/[id])', () => {
	test('a new price value is saved', async () => {
		const dto = fixture.LIST_PRICING_TABLE.find(
			(p) => p.type === 'labour' && p.formula === 'none'
		)!;
		const price = (await pricingService.getPriceListByInternalId(dto.uuid))!;
		const newValue = Math.round(Math.random() * 10000) / 100;

		await pricingService.updatePricing({ ...price, price: newValue });
		expect((await pricingService.getPriceListByInternalId(dto.uuid))!.price).toBe(newValue);

		await pricingService.updatePricing(price);
	});

	test('a deleted price is gone from detail and list', async () => {
		const dto = fixture.LIST_PRICING_TABLE.find((p) => p.type === 'hanger')!;
		const price = (await pricingService.getPriceListByInternalId(dto.uuid))!;

		await pricingService.deleteListPrices([price]);
		expect(await pricingService.getPriceListByInternalId(dto.uuid)).toBeUndefined();
		expect(
			(await pricingService.getPricingList(PricingType.HANGER)).map((p) => p.id)
		).not.toContain(dto.id);

		await pricingService.updatePricing(price);
	});
});

describe('mold price upload (api/prices/molds/upload)', () => {
	let original: ListPrice[];
	beforeAll(async () => {
		original = await pricingService.getPricingList(PricingType.MOLD);
	});
	afterAll(async () => {
		await pricingService.deleteListPrices(await pricingService.getPricingList(PricingType.MOLD));
		await pricingService.batchStoreListPrices(PricingType.MOLD, original);
	});

	test('the uploaded spreadsheet replaces every mold price', async () => {
		const molds = fixture.LIST_PRICING_TABLE.filter((p) => p.type === 'mold').slice(0, 15);
		const rows = molds.map((m) => {
			const [ubi, ...ref] = m.id.split('_');
			return [ubi, ref.join('_'), m.price, m.floating ? 'S' : ' '];
		});
		const sheet = utils.aoa_to_sheet([['UBI', 'REF', 'PRECIO', 'FLOTANTE'], ...rows]);
		for (let row = 2; row <= rows.length + 10; row++) {
			for (const col of ['H', 'I', 'J']) sheet[`${col}${row}`] = { t: 'n', v: row };
		}
		sheet['!ref'] = `A1:J${rows.length + 10}`;
		const book = utils.book_new();
		utils.book_append_sheet(book, sheet, 'TODAS');

		const loader = new MoldPriceLoader(config());
		const { filename, url } = await loader.generateFileUploadUrl();
		const upload = await fetch(url, {
			method: 'PUT',
			body: write(book, { type: 'buffer', bookType: 'xlsx' }),
			headers: {
				'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			}
		});
		expect(upload.ok).toBe(true);

		await loader.loadMoldPrices(filename);

		const list = await pricingService.getPricingList(PricingType.MOLD);
		expect(list.map((m) => [m.id, m.price, m.description, m.floating]).sort()).toEqual(
			molds.map((m) => [m.id, m.price, m.description, m.floating ?? false]).sort()
		);
	});
});
