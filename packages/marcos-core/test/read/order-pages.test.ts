import { describe, expect, test } from 'bun:test';
import {
	customersById,
	deletedOrders,
	fixtureIds,
	liveOrders,
	publicServices,
	services,
	tempOrders,
	calculatedItemOf,
	expectedTotal
} from '../support';

const { orderService } = services();

describe('same-day page (orders/[id]/day, orders/[id]/whatsapp)', () => {
	test('lists the customer orders of that day, quotes excluded', async () => {
		const dayKey = (ts: number) => new Date(ts).toDateString();
		await Promise.all(
			liveOrders
				.filter((o) => customersById.has(o.customerUuid))
				.map(async (dto) => {
					const order = (await orderService.getOrderById(dto.uuid))!;
					const expected = liveOrders.filter(
						(o) =>
							o.customerUuid === dto.customerUuid &&
							dayKey(o.timestamp) === dayKey(dto.timestamp) &&
							o.status !== 'quote'
					);
					const orders = await orderService.getOrdersOnSameDay(order);
					expect(orders.map((o) => o.order.id).sort()).toEqual(fixtureIds(expected));
				})
		);
	}, 60_000);
});

describe('order search by public id (orders/search)', () => {
	test('every live order resolves, deleted ones do not', async () => {
		await Promise.all(
			liveOrders.map(async (dto) =>
				expect(await orderService.getOrderIdByPublicId(dto.publicId)).toBe(dto.uuid)
			)
		);
		for (const dto of deletedOrders) {
			expect(await orderService.getOrderIdByPublicId(dto.publicId)).toBeNull();
		}
	}, 60_000);
});

describe('public receipt (/s/[id], /track/[id])', () => {
	test('every linked order is shown by short id with its totals', async () => {
		await Promise.all(
			liveOrders
				.filter((o) => customersById.has(o.customerUuid))
				.map(async (dto) => {
					const receipt = (await publicServices().publicReceiptService.getPublicOrder(
						dto.shortId
					))!;
					expect(receipt.order.id).toBe(dto.uuid);
					expect(receipt.order.customer.name).toBe(customersById.get(dto.customerUuid)!.name);
					expect(receipt.totals.total).toBeCloseTo(expectedTotal(calculatedItemOf(dto.uuid)), 2);
				})
		);
	}, 60_000);

	test('temp-customer and deleted orders are not shown', async () => {
		for (const dto of [...tempOrders, ...deletedOrders]) {
			expect(await publicServices().publicReceiptService.getPublicOrder(dto.shortId)).toBeNull();
		}
	});
});
