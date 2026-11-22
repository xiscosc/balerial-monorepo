import { describe, expect, test } from 'bun:test';
import { OrderStatus } from '@marcsimolduressonsardina/contracts/type';
import { fixture, fixtureIds, inBatches, liveOrders, services } from '../support';

const { customerService, orderService } = services();
const ids = (orders: { order: { id: string } }[]) => orders.map((o) => o.order.id).sort();

describe('customer pages (customers/[id], customers/[id]/orders, customers/[id]/edit)', () => {
	test('every customer loads with its orders and quotes', async () => {
		await inBatches(fixture.CUSTOMER_TABLE, async (dto) => {
			expect(await customerService.getCustomerById(dto.uuid)).toEqual({
				id: dto.uuid,
				name: dto.name,
				phone: dto.phone,
				storeId: dto.storeId
			});
			const own = liveOrders.filter((o) => o.customerUuid === dto.uuid);

			const orders = await orderService.getOrdersByCustomerId(dto.uuid);
			expect(ids(orders)).toEqual(fixtureIds(own.filter((o) => o.status !== 'quote')));
			const times = orders.map((o) => o.order.createdAt.getTime());
			expect(times).toEqual([...times].sort((a, b) => b - a));

			const quotes = await orderService.getOrdersByCustomerIdAndStatus(dto.uuid, OrderStatus.QUOTE);
			expect(ids(quotes)).toEqual(fixtureIds(own.filter((o) => o.status === 'quote')));
		});
	}, 60_000);
});

describe('customer search (customers/search, customers/new, api/customers/search)', () => {
	test('every customer is found by phone', async () => {
		await inBatches(fixture.CUSTOMER_TABLE, async (dto) => {
			expect((await customerService.getCustomerByPhone(dto.phone))?.id).toBe(dto.uuid);
		});
	}, 60_000);

	test('name search matches the normalized name', async () => {
		for (const dto of fixture.CUSTOMER_TABLE.slice(0, 50)) {
			const query = dto.name.toUpperCase();
			const expected = fixture.CUSTOMER_TABLE.filter((c) =>
				c.normalizedName.includes(dto.normalizedName)
			);
			expect((await customerService.searchCustomers(query)).map((c) => c.id).sort()).toEqual(
				expected.map((c) => c.uuid).sort()
			);
		}
	}, 60_000);
});

describe('customer list (api/customers/list)', () => {
	test('walks every customer in pages of 25', async () => {
		const seen: string[] = [];
		let nextKey: Record<string, string | number> | undefined;
		do {
			const page = await customerService.getAllCustomersPaginated(nextKey);
			expect(page.customers.length).toBeLessThanOrEqual(25);
			seen.push(...page.customers.map((c) => c.id));
			nextKey = page.nextKey;
		} while (nextKey);
		expect(seen.sort()).toEqual(fixture.CUSTOMER_TABLE.map((c) => c.uuid).sort());
	});
});
