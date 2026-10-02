import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { OrderDto } from '../../src/repository/dto/order.dto';
import { OrderRepositoryDynamoDb } from '../../src/repository/dynamodb/order.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('orders');
const repository = new OrderRepositoryDynamoDb({ ...config, orderTable: table });
const foreignRepository = new OrderRepositoryDynamoDb({ ...config, storeId: 'store-2', orderTable: table });
const order = (uuid: string, overrides: Partial<OrderDto> = {}): OrderDto =>
	({
		uuid,
		storeId: config.storeId,
		customerUuid: 'customer-1',
		timestamp: 100,
		status: 'pending',
		shortId: `short-${uuid}`,
		publicId: `public-${uuid}`,
		...overrides
	}) as OrderDto;

beforeAll(() => createTable(table, 'uuid', undefined, ['timestamp'], [
	{ name: 'customer', partitionKey: 'customerUuid', sortKey: 'timestamp' },
	{ name: 'shortId', partitionKey: 'shortId' },
	{ name: 'status', partitionKey: 'status', sortKey: 'timestamp' },
	{ name: 'store', partitionKey: 'storeId', sortKey: 'timestamp' },
	{ name: 'publicId', partitionKey: 'publicId' }
]));
afterAll(() => deleteTable(table));

describe('OrderRepositoryDynamoDb', () => {
	test('persists orders and retrieves them through every public lookup', async () => {
		const first = order('order-1', { timestamp: 100 });
		const second = order('order-2', { timestamp: 200 });
		await repository.storeOrders([first, second]);

		expect(await repository.getOrderById(first.uuid)).toEqual(first);
		expect(await eventually(() => repository.getOrderByShortId(first.shortId), Boolean)).toEqual(first);
		expect(await repository.getOrderByPublicId(first.publicId!)).toEqual(first);
		expect(await repository.getOrdersByCustomerId('customer-1')).toEqual([first, second]);
		expect(await repository.getOrdersByStatus('pending')).toEqual([first, second]);
		expect(await repository.getOrdersBetweenTs('customer-1', 150, 250)).toEqual([second]);
		expect((await repository.getOrdersByStatusPaginated('pending')).elements).toEqual([second, first]);
	});

	test('applies search and customer filters to persisted data', async () => {
		const matching = order('search-match', {
			customerUuid: 'customer-search',
			timestamp: 300,
			item: { normalizedDescription: 'red shirt' }
		} as Partial<OrderDto>);
		const other = order('search-other', {
			customerUuid: 'customer-other',
			timestamp: 301,
			item: { normalizedDescription: 'red shirt' }
		} as Partial<OrderDto>);
		await repository.storeOrders([matching, other]);

		const result = await eventually(
			() => repository.findOrdersByStatus('pending', 'shirt', true, 'customer-search'),
			(items) => items.length === 1
		);
		expect(result).toEqual([matching]);
	});

	test('updates individual order fields and persists the result', async () => {
		const updated = order('updated', {
			notified: true,
			invoiced: true,
			location: 'shelf',
			status: 'completed',
			amountPayed: 25,
			customerUuid: 'customer-updated'
		});
		await repository.createOrder(order('updated'));
		await repository.setOrderNotified(updated);
		await repository.setOrderInvoiced(updated);
		await repository.setOrderStatus(updated);
		await repository.updateAmountPayed(updated);
		await repository.updateCustomerId(updated);

		expect(await repository.getOrderById(updated.uuid)).toEqual(updated);
	});

	test('hides deleted and cross-store orders from reads', async () => {
		const deleted = order('deleted', { status: 'deleted' });
		const foreign = order('foreign', { storeId: 'store-2' });
		await repository.createOrder(deleted);
		await foreignRepository.createOrder(foreign);

		expect(await repository.getOrderById(deleted.uuid)).toBeNull();
		expect(await repository.getOrderById(foreign.uuid)).toBeNull();
		expect(await repository.getOrdersByIds([deleted.uuid, foreign.uuid])).toEqual([]);
	});

	test('rejects invalid and cross-store writes', async () => {
		await repository.createOrder(order('ignored', { storeId: 'store-2' }));
		expect(await foreignRepository.getOrderById('ignored')).toBeNull();
		await expect(repository.createOrder(order('invalid', { customerUuid: '' }))).rejects.toThrow(
			'Invalid order data'
		);
		await expect(repository.storeOrders([order('wrong-store', { storeId: 'store-2' })])).rejects.toThrow(
			'Store id does not match'
		);
	});
});
