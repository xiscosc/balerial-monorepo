import { describe, expect, test } from 'bun:test';
import { OrderAuditTrailType, OrderStatus } from '@marcsimolduressonsardina/contracts/type';
import { quoteDeliveryDate, tempCustomerUuid } from '../../src/utilities/order.utilities';
import {
	calculatedItemOf,
	customersById,
	expectedTotal,
	liveOrders,
	locations,
	reserve,
	services
} from '../support';

const { orderService, orderAuditTrailService } = services();
const linked = (o: { customerUuid: string }) => customersById.has(o.customerUuid);
const load = async (id: string) => (await orderService.getOrderById(id))!;
const audit = async (id: string, type: OrderAuditTrailType) =>
	(await orderAuditTrailService.getEntriesForOrder(id, type)).map((e) => [e.oldValue, e.newValue]);

describe('order detail actions (orders/[id])', () => {
	test('save location: a pending order becomes finished at that location', async () => {
		const [dto] = reserve(1, (o) => o.status === 'pending' && linked(o));
		await orderService.setOrderStatus(await load(dto!.uuid), OrderStatus.FINISHED, locations[0]);

		expect(await load(dto!.uuid)).toMatchObject({
			status: OrderStatus.FINISHED,
			location: locations[0]
		});
		expect(await audit(dto!.uuid, OrderAuditTrailType.STATUS)).toEqual([['pending', 'finished']]);
		expect(await audit(dto!.uuid, OrderAuditTrailType.LOCATION)).toEqual([
			[dto!.location ?? '', locations[0]]
		]);
	});

	test('change status: a finished order is picked up and its location cleared', async () => {
		const [dto] = reserve(1, (o) => o.status === 'finished' && linked(o) && !!o.location);
		await orderService.setOrderStatus(await load(dto!.uuid), OrderStatus.PICKED_UP);

		expect(await load(dto!.uuid)).toMatchObject({ status: OrderStatus.PICKED_UP, location: '' });
		expect(await audit(dto!.uuid, OrderAuditTrailType.LOCATION)).toEqual([[dto!.location, '']]);
	});

	test('delete: the order disappears from detail, lists and its customer', async () => {
		const [dto] = reserve(1, (o) => o.status === 'pending' && linked(o));
		await orderService.setOrderStatus(await load(dto!.uuid), OrderStatus.DELETED);

		expect(await orderService.getOrderById(dto!.uuid)).toBeNull();
		expect(
			(await orderService.getOrdersByStatus(OrderStatus.PENDING)).map((o) => o.order.id)
		).not.toContain(dto!.uuid);
		expect(
			(await orderService.getOrdersByCustomerId(dto!.customerUuid)).map((o) => o.order.id)
		).not.toContain(dto!.uuid);
	});

	test('invoiced can be set and unset', async () => {
		const [dto] = reserve(1, (o) => !o.invoiced && linked(o));
		await orderService.setOrderInvoiced(await load(dto!.uuid), true);
		expect((await load(dto!.uuid)).invoiced).toBe(true);
		await orderService.setOrderInvoiced(await load(dto!.uuid), false);
		expect((await load(dto!.uuid)).invoiced).toBe(false);
	});

	test('payment: fully paid, unpaid, and partially paid', async () => {
		const [unpaid] = reserve(1, (o) => o.amountPayed === 0 && o.status !== 'quote' && linked(o));
		const total = expectedTotal(calculatedItemOf(unpaid!.uuid));

		await orderService.setOrderFullyPaid(await load(unpaid!.uuid));
		const paid = (await orderService.getFullOrderById(unpaid!.uuid))!;
		expect(paid.order.amountPayed).toBeCloseTo(total, 2);
		expect(paid.totals).toMatchObject({ payed: true, remainingAmount: 0 });

		await orderService.setOrderPartiallyPaid(await load(unpaid!.uuid), 0);
		expect((await load(unpaid!.uuid)).amountPayed).toBe(0);

		const [partial] = reserve(
			1,
			(o) =>
				linked(o) && o.amountPayed > 0 && o.amountPayed < expectedTotal(calculatedItemOf(o.uuid))
		);
		await orderService.setOrderPartiallyPaid(await load(partial!.uuid), 0);
		await orderService.setOrderPartiallyPaid(await load(partial!.uuid), partial!.amountPayed);
		const restored = (await orderService.getFullOrderById(partial!.uuid))!;
		expect(restored.order.amountPayed).toBe(partial!.amountPayed);
		expect(restored.totals.payed).toBe(false);

		expect(await audit(partial!.uuid, OrderAuditTrailType.PAYMENT)).toEqual(
			expect.arrayContaining([
				[partial!.amountPayed, 0],
				[0, partial!.amountPayed]
			])
		);
	});

	test('denote: an order goes back to quote, unpaid and not notified', async () => {
		const [dto] = reserve(1, (o) => o.status === 'pending' && linked(o) && o.amountPayed > 0);
		await orderService.moveOrderToQuote(await load(dto!.uuid));

		expect(await load(dto!.uuid)).toMatchObject({
			status: OrderStatus.QUOTE,
			amountPayed: 0,
			notified: false,
			item: { deliveryDate: quoteDeliveryDate }
		});
	});

	test('promote: a quote becomes a pending order with the chosen delivery date', async () => {
		const [quote] = reserve(1, (o) => o.status === 'quote' && linked(o));
		const deliveryDate = new Date(
			liveOrders.find((o) => o.status === 'pending')!.item.deliveryDate
		);
		await orderService.moveQuoteToOrder(await load(quote!.uuid), deliveryDate);

		expect(await load(quote!.uuid)).toMatchObject({
			status: OrderStatus.PENDING,
			item: { deliveryDate }
		});
		expect(await audit(quote!.uuid, OrderAuditTrailType.STATUS)).toEqual([['quote', 'pending']]);
	});
});

describe('notify (api/orders/[id]/notify)', () => {
	test('the order is marked notified and the detail page lists the notification', async () => {
		const [dto] = reserve(1, (o) => !o.notified && o.status === 'finished' && linked(o));
		await orderService.setOrderAsNotified(await load(dto!.uuid));

		expect((await load(dto!.uuid)).notified).toBe(true);
		const entries = await orderAuditTrailService.getEntriesForOrder(
			dto!.uuid,
			OrderAuditTrailType.NOTIFICATION
		);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({ newValue: true, userId: 'empleado1@local.test' });
	});
});

describe('bulk operations (api/orders PATCH)', () => {
	test('paid, invoiced, picked up and notified on several orders at once', async () => {
		const picked = reserve(5, (o) => o.status === 'finished' && linked(o) && !o.invoiced);
		const orders = await orderService.getOrdersByIds(picked.map((o) => o.uuid));
		expect(orders).toHaveLength(5);

		await Promise.all([
			...orders.map((o) => orderService.setOrderFullyPaid(o)),
			...orders.map((o) => orderService.setOrderInvoiced(o, true)),
			...orders.map((o) => orderService.setOrderStatus(o, OrderStatus.PICKED_UP)),
			...orders.map((o) => orderService.setOrderAsNotified(o))
		]);

		for (const dto of picked) {
			const full = (await orderService.getFullOrderById(dto.uuid))!;
			expect(full.order).toMatchObject({
				status: OrderStatus.PICKED_UP,
				invoiced: true,
				notified: true
			});
			expect(full.order.amountPayed).toBeCloseTo(expectedTotal(calculatedItemOf(dto.uuid)), 2);
		}
	});

	test('unlinked orders can be deleted in bulk', async () => {
		const picked = reserve(2, (o) => o.customerUuid === tempCustomerUuid);
		const orders = await orderService.getOrdersByIds(picked.map((o) => o.uuid));
		await Promise.all(orders.map((o) => orderService.setOrderStatus(o, OrderStatus.DELETED)));
		expect(await orderService.getOrdersByIds(picked.map((o) => o.uuid))).toEqual([]);
	});
});
