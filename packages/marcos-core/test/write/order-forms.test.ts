import { describe, expect, test } from 'bun:test';
import { OrderAuditTrailType, OrderStatus } from '../../src/types/order.type';
import { quoteDeliveryDate, tempCustomerUuid } from '../../src/utilities/order.utilities';
import { CalculatedItemUtilities, cornersId } from '../../src/utilities/calculated-item.utilites';
import {
	calculatedItemOf,
	customersById,
	expectedTotal,
	fixture,
	formDtoFrom,
	pricedAsStored,
	randomName,
	randomPhone,
	reserve,
	services
} from '../support';

const {
	orderService,
	customerService,
	orderAuditTrailService,
	createOrderServiceWithMarkup,
	createCalculatedItemServiceWithMarkup
} = services();
const linked = (o: { customerUuid: string }) => customersById.has(o.customerUuid);
const parts = (p: { priceId: string; price: number; quantity: number; description: string }[]) =>
	p.map(({ priceId, price, quantity, description }) => ({ priceId, price, quantity, description }));

describe('new order / new quote (orders/new, customers/[id]/orders/new)', () => {
	test('re-creating real orders from their form data gives the same parts and totals', async () => {
		const sources = reserve(20, (o) => linked(o) && o.status !== 'quote' && pricedAsStored(o));
		for (const source of sources) {
			const full = (await orderService.getFullOrderById(source.uuid))!;
			const created = (await orderService.createOrderFromDto(
				formDtoFrom(full, false, source.customerUuid)
			))!;
			const stored = calculatedItemOf(source.uuid);

			expect(parts(created.calculatedItem.parts)).toEqual(parts(stored.parts));
			expect(created.calculatedItem).toMatchObject({
				discount: stored.discount,
				quantity: stored.quantity
			});
			expect(created.totals.total).toBeCloseTo(expectedTotal(stored), 2);
			expect(created.order).toMatchObject({
				status: OrderStatus.PENDING,
				amountPayed: 0,
				customer: { id: source.customerUuid },
				item: {
					description: source.item.description,
					width: source.item.width,
					height: source.item.height
				}
			});
			expect(created.order.id).not.toBe(source.uuid);
			expect(created.order.shortId).toHaveLength(10);
			expect(created.order.publicId).toEndWith(
				customersById.get(source.customerUuid)!.phone.replace('+', '')
			);

			expect(await orderService.getFullOrderById(created.order.id)).toMatchObject({
				order: { id: created.order.id, status: OrderStatus.PENDING },
				calculatedItem: { parts: created.calculatedItem.parts }
			});
			expect(
				(await orderService.getOrdersByCustomerId(source.customerUuid)).map((o) => o.order.id)
			).toContain(created.order.id);
			expect(
				(await orderAuditTrailService.getEntriesForOrder(created.order.id)).map((e) => [
					e.type,
					e.newValue
				])
			).toEqual([[OrderAuditTrailType.STATUS, OrderStatus.PENDING]]);
		}
	}, 60_000);

	test('a quote is created as quote with the quote delivery date', async () => {
		const [source] = reserve(1, (o) => linked(o) && o.status === 'quote' && pricedAsStored(o));
		const full = (await orderService.getFullOrderById(source!.uuid))!;
		const created = (await orderService.createOrderFromDto(
			formDtoFrom(full, true, source!.customerUuid)
		))!;

		expect(created.order.status).toBe(OrderStatus.QUOTE);
		expect(created.order.item.deliveryDate).toEqual(quoteDeliveryDate);
		expect(created.totals.total).toBeCloseTo(expectedTotal(calculatedItemOf(source!.uuid)), 2);
	});

	test('without a customer the order is created unlinked', async () => {
		const [source] = reserve(1, (o) => linked(o) && o.status === 'pending' && pricedAsStored(o));
		const full = (await orderService.getFullOrderById(source!.uuid))!;
		const created = (await orderService.createOrderFromDto(formDtoFrom(full, false)))!;

		expect(created.order.customer.id).toBe(tempCustomerUuid);
		expect(
			(
				await orderService.getOrdersByStatusPaginated(
					OrderStatus.PENDING,
					undefined,
					true,
					tempCustomerUuid
				)
			).orders.map((o) => o.order.id)
		).toContain(created.order.id);
	});
});

describe('edit order (orders/[id]/edit)', () => {
	test('replacing an order item recalculates it and keeps its identity, status and payment', async () => {
		const [target, other] = reserve(
			2,
			(o) => linked(o) && o.status === 'finished' && pricedAsStored(o)
		);
		const before = (await orderService.getFullOrderById(target!.uuid))!;
		const otherFull = (await orderService.getFullOrderById(other!.uuid))!;

		await orderService.updateOrderFromDto(
			target!.uuid,
			formDtoFrom(otherFull, false, before.order.customer.id)
		);
		const after = (await orderService.getFullOrderById(target!.uuid))!;

		expect(after.order).toMatchObject({
			id: target!.uuid,
			shortId: target!.shortId,
			publicId: target!.publicId,
			status: OrderStatus.FINISHED,
			amountPayed: target!.amountPayed,
			createdAt: new Date(target!.timestamp),
			customer: { id: target!.customerUuid },
			item: {
				description: other!.item.description,
				width: other!.item.width,
				height: other!.item.height
			}
		});
		expect(parts(after.calculatedItem.parts)).toEqual(parts(calculatedItemOf(other!.uuid).parts));
		expect(after.totals.total).toBeCloseTo(expectedTotal(calculatedItemOf(other!.uuid)), 2);

		const [entry] = await orderAuditTrailService.getEntriesForOrder(
			target!.uuid,
			OrderAuditTrailType.DATA
		);
		expect(entry).toBeDefined();
	});
});

describe('external order (external/orders/new)', () => {
	test('without markup it prices like the real order and is not saved', async () => {
		const [source] = reserve(1, (o) => linked(o) && o.status !== 'quote' && pricedAsStored(o));
		const full = (await orderService.getFullOrderById(source!.uuid))!;
		const external = await createOrderServiceWithMarkup(0).createExternalOrderFromDto({
			...formDtoFrom(full, false),
			markup: 0
		});
		const total = expectedTotal(calculatedItemOf(source!.uuid));

		expect(parts(external.calculatedItem.parts)).toEqual(
			parts(calculatedItemOf(source!.uuid).parts)
		);
		expect(external.totals).toMatchObject({ markup: 0, totalWithoutMarkup: external.totals.total });
		expect(external.totals.total).toBeCloseTo(total, 2);
		const amount = external.totals.total.toFixed(2).replace('.', '');
		expect(external.order.reference).toBe(`${amount}/0/${amount}`);
		expect(external.order.publicId).toMatch(/^\d{8}\/[A-Z1-9]{4}\/EXTERNO$/);
		expect(await orderService.getOrderById(external.order.id)).toBeNull();
	});

	test('with 20% markup it prices like the order form shows and keeps the price without markup', async () => {
		const markup = 20;
		const sources = reserve(10, (o) => linked(o) && o.status !== 'quote' && pricedAsStored(o));
		const formPricing = createCalculatedItemServiceWithMarkup(markup);

		for (const source of sources) {
			const full = (await orderService.getFullOrderById(source.uuid))!;
			const dto = formDtoFrom(full, false);
			const extraParts = dto.extraParts.map((p) =>
				p.priceId === cornersId ? CalculatedItemUtilities.getCornersPricing(markup) : p
			);
			const external = await createOrderServiceWithMarkup(markup).createExternalOrderFromDto({
				...dto,
				extraParts,
				markup
			});

			const { item } = full.order;
			const dimensions = item.ppDimensions
				? CalculatedItemUtilities.getOrderDimensions(item.width, item.height, 0, item.ppDimensions)
				: CalculatedItemUtilities.getOrderDimensions(item.width, item.height, item.pp);
			const shown = await Promise.all(
				item.partsToCalculate.map((pre) => formPricing.calculatePart(pre, dimensions))
			);
			expect(parts(external.calculatedItem.parts)).toEqual(parts([...shown, ...extraParts]));

			const stored = calculatedItemOf(source.uuid).parts;
			for (const [index, part] of shown.entries()) {
				expect(part.price).toBeGreaterThanOrEqual(stored[index]!.price);
			}

			const { total, totalWithoutMarkup } = external.totals;
			expect(external.totals.markup).toBe(markup);
			expect(totalWithoutMarkup).toBe(Math.round((total / 1.2) * 100) / 100);
			expect(external.order.reference).toBe(
				`${total.toFixed(2).replace('.', '')}/${markup}/${totalWithoutMarkup.toFixed(2).replace('.', '')}`
			);
			expect(await orderService.getOrderById(external.order.id)).toBeNull();
		}
	});
});

describe('link a customer to an unlinked order (orders/[id]/link)', () => {
	test('with the phone of an existing customer', async () => {
		const [temp] = reserve(1, (o) => o.customerUuid === tempCustomerUuid);
		const customer = (await customerService.getCustomerByPhone(fixture.CUSTOMER_TABLE[0]!.phone))!;
		await orderService.addCustomerToTemporaryOrder(
			customer,
			(await orderService.getOrderById(temp!.uuid))!
		);

		expect((await orderService.getOrderById(temp!.uuid))!.customer).toEqual(customer);
		expect(
			(
				await orderService.getOrdersByCustomerIdAndStatus(customer.id, temp!.status as OrderStatus)
			).map((o) => o.order.id)
		).toContain(temp!.uuid);
	});

	test('creating a new customer when the phone is unknown', async () => {
		const [temp] = reserve(1, (o) => o.customerUuid === tempCustomerUuid);
		const phone = randomPhone();
		expect(await customerService.getCustomerByPhone(phone)).toBeNull();

		const customer = await customerService.createCustomer(randomName(), phone);
		await orderService.addCustomerToTemporaryOrder(
			customer,
			(await orderService.getOrderById(temp!.uuid))!
		);

		expect((await orderService.getOrderById(temp!.uuid))!.customer).toEqual(customer);
		expect((await customerService.getCustomerByPhone(phone))?.id).toBe(customer.id);
	});
});
