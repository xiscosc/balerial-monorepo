import { describe, expect, test } from 'bun:test';
import { OrderStatus, type FullOrder } from '../../src/types/order.type';
import { tempCustomerUuid } from '../../src/utilities/order.utilities';
import { fixtureIds, liveOrders, services } from '../support';

const { orderService } = services();
const allowedStatus = [
	OrderStatus.QUOTE,
	OrderStatus.PENDING,
	OrderStatus.FINISHED,
	OrderStatus.PICKED_UP
];
const unlinkedStatus = [OrderStatus.PENDING, OrderStatus.QUOTE];
const ids = (orders: FullOrder[]) => orders.map((o) => o.order.id).sort();

async function walk(status: OrderStatus, descendent: boolean, customerUuid?: string) {
	const pages: FullOrder[][] = [];
	let lastKey: Record<string, string | number> | undefined;
	do {
		const page = await orderService.getOrdersByStatusPaginated(
			status,
			lastKey,
			descendent,
			customerUuid
		);
		pages.push(page.orders);
		lastKey = page.nextKey;
	} while (lastKey);
	return pages;
}

describe('order list (api/orders/list)', () => {
	for (const status of allowedStatus) {
		for (const descendent of [true, false]) {
			test(`${status}, ${descendent ? 'newest' : 'oldest'} first: every order once, in order, pages of 25`, async () => {
				const pages = await walk(status, descendent);
				const orders = pages.flat();
				expect(pages.every((p) => p.length <= 25)).toBe(true);
				expect(ids(orders)).toEqual(fixtureIds(liveOrders.filter((o) => o.status === status)));
				const times = orders.map((o) => o.order.createdAt.getTime());
				expect(times).toEqual([...times].sort((a, b) => (descendent ? b - a : a - b)));
			});
		}
	}

	for (const status of unlinkedStatus) {
		test(`${status}, unlinked only: just the temp-customer orders`, async () => {
			const orders = (await walk(status, true, tempCustomerUuid)).flat();
			expect(ids(orders)).toEqual(
				fixtureIds(
					liveOrders.filter((o) => o.status === status && o.customerUuid === tempCustomerUuid)
				)
			);
		});
	}
});

describe('order search (api/orders/search)', () => {
	const words = [...new Set(liveOrders.map((o) => o.item.description.split(' ')[0]!))];
	const exact = liveOrders.find((o) => o.status === 'finished')!.item.description;

	for (const status of allowedStatus) {
		test(`${status}: description search ignores case and accents`, async () => {
			for (const query of [...words, exact]) {
				const normalized = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
				const expected = fixtureIds(
					liveOrders.filter(
						(o) => o.status === status && o.item.normalizedDescription.includes(normalized)
					)
				);
				expect(ids(await orderService.findOrdersByStatus(status, query.toUpperCase()))).toEqual(
					expected
				);
			}
		});
	}

	for (const status of unlinkedStatus) {
		test(`${status}, unlinked only: search within temp-customer orders`, async () => {
			for (const query of words) {
				const normalized = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
				const expected = fixtureIds(
					liveOrders.filter(
						(o) =>
							o.status === status &&
							o.customerUuid === tempCustomerUuid &&
							o.item.normalizedDescription.includes(normalized)
					)
				);
				expect(
					ids(await orderService.findOrdersByStatus(status, query, true, tempCustomerUuid))
				).toEqual(expected);
			}
		});
	}
});
