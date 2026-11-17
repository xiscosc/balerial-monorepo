import { describe, expect, test } from 'bun:test';
import { OrderStatus } from '../../src/types/order.type';
import { tempCustomerUuid } from '../../src/utilities/order.utilities';
import {
	calculatedItemOf,
	customersById,
	deletedOrders,
	expectedTotal,
	fixture,
	groupBy,
	inBatches,
	liveOrders,
	locations,
	services
} from '../support';

const { orderService, fileService, configService } = services();

describe('order detail page (orders/[id], orders/[id]/print)', () => {
	test('every live order loads with its customer, item, calculated item and totals', async () => {
		for (const dto of liveOrders) {
			const full = (await orderService.getFullOrderById(dto.uuid))!;
			const customer = customersById.get(dto.customerUuid);

			expect(full.order).toMatchObject({
				id: dto.uuid,
				shortId: dto.shortId,
				publicId: dto.publicId,
				status: dto.status as OrderStatus,
				amountPayed: dto.amountPayed,
				createdAt: new Date(dto.timestamp),
				location: dto.location ?? '',
				notified: dto.notified ?? false,
				invoiced: dto.invoiced ?? false,
				user: { id: dto.userId, name: dto.userName }
			});
			expect(full.order.customer.id).toBe(customer?.uuid ?? tempCustomerUuid);
			if (customer) expect(full.order.customer.name).toBe(customer.name);

			expect(full.order.item).toMatchObject({
				width: dto.item.width,
				height: dto.item.height,
				description: dto.item.description,
				quantity: dto.item.quantity,
				deliveryDate: new Date(dto.item.deliveryDate),
				partsToCalculate: dto.item.partsToCalculate
			});

			const stored = calculatedItemOf(dto.uuid);
			expect(full.calculatedItem).toMatchObject({
				discount: stored.discount,
				quantity: stored.quantity,
				parts: stored.parts.map((p) => ({
					priceId: p.priceId,
					price: p.price,
					quantity: p.quantity
				}))
			});
			const total = expectedTotal(stored);
			expect(full.totals.total).toBeCloseTo(total, 2);
			expect(full.totals.remainingAmount).toBeCloseTo(total - dto.amountPayed, 2);
		}
	}, 60_000);

	test('deleted orders do not load', async () => {
		for (const dto of deletedOrders) {
			expect(await orderService.getFullOrderById(dto.uuid)).toBeNull();
			expect(await orderService.getOrderById(dto.uuid)).toBeNull();
		}
	});

	test('files of each order are listed', async () => {
		const filesByOrder = groupBy(fixture.FILE_TABLE ?? [], (f) => f.orderUuid);
		for (const dto of liveOrders) {
			const files = await fileService.getFilesByOrder(dto.uuid);
			const stored = filesByOrder.get(dto.uuid) ?? [];
			expect(files.map((f) => [f.id, f.type, f.originalFilename]).sort()).toEqual(
				stored.map((f) => [f.fileUuid, f.type, f.originalFilename]).sort()
			);
			for (const file of files.filter((f) => f.type !== 'no_art')) {
				const key = stored.find((f) => f.fileUuid === file.id)!;
				expect(decodeURIComponent(file.downloadUrl!)).toContain(key.optimizedKey ?? key.key);
			}
		}
	}, 60_000);

	test('store locations are listed', async () => {
		expect(await configService.getLocationsList()).toEqual(locations);
	});

	test('same-day counters count the customer orders of that day, quotes excluded', async () => {
		const dayKey = (ts: number) => new Date(ts).toDateString();
		const check = async (dto: (typeof liveOrders)[number]) => {
			const order = (await orderService.getOrderById(dto.uuid))!;
			const sameDay = liveOrders.filter(
				(o) =>
					o.customerUuid === dto.customerUuid &&
					dayKey(o.timestamp) === dayKey(dto.timestamp) &&
					o.status !== 'quote'
			);
			expect(await orderService.getOrdersCountOnSameDay(order)).toEqual({
				totalCount: sameDay.length,
				finishedCount: sameDay.filter((o) => o.status === 'finished').length,
				pendingCount: sameDay.filter((o) => o.status === 'pending').length
			});
		};
		await inBatches(
			liveOrders.filter((o) => customersById.has(o.customerUuid)),
			check
		);
	}, 60_000);
});
