import { describe, expect, test } from 'bun:test';
import { fixture, liveOrders, randomName, randomPhone, services } from '../support';

const { customerService } = services();

describe('new customer (customers/new)', () => {
	test('an unknown phone creates the customer', async () => {
		const phone = randomPhone();
		const name = randomName();
		expect(await customerService.getCustomerByPhone(phone)).toBeNull();

		const created = await customerService.createCustomer(name, phone);
		expect(await customerService.getCustomerById(created.id)).toEqual({
			id: created.id,
			name,
			phone,
			storeId: 'local-store'
		});
		expect((await customerService.searchCustomers(name)).map((c) => c.id)).toEqual([created.id]);
	});

	test('a known phone finds the existing customer instead', async () => {
		const existing = fixture.CUSTOMER_TABLE[1]!;
		expect((await customerService.getCustomerByPhone(existing.phone))?.id).toBe(existing.uuid);
	});
});

describe('edit customer (customers/[id]/edit)', () => {
	test('name and phone changes are saved and searchable', async () => {
		const dto = fixture.CUSTOMER_TABLE[2]!;
		const customer = (await customerService.getCustomerById(dto.uuid))!;
		const name = randomName();
		const phone = randomPhone();

		await customerService.updateCustomerData(customer, name, phone);

		expect(await customerService.getCustomerById(dto.uuid)).toMatchObject({ name, phone });
		expect((await customerService.getCustomerByPhone(phone))?.id).toBe(dto.uuid);
		expect(await customerService.getCustomerByPhone(dto.phone)).toBeNull();
		expect((await customerService.searchCustomers(name)).map((c) => c.id)).toEqual([dto.uuid]);
	});
});

describe('delete customer (customers/[id])', () => {
	test('a customer is removed', async () => {
		const dto =
			fixture.CUSTOMER_TABLE.find((c) => !liveOrders.some((o) => o.customerUuid === c.uuid)) ??
			(await customerService.createCustomer(randomName(), randomPhone()));
		const id = 'uuid' in dto ? dto.uuid : dto.id;

		await customerService.deleteCustomerById(id);
		expect(await customerService.getCustomerById(id)).toBeNull();
	});
});
