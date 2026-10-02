import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { OrderDto } from '../../src/repository/dto/order.dto';
import { OrderRepositoryDynamoDb } from '../../src/repository/dynamodb/order.repository.dynamodb';
import { PublicOrderRepositoryDynamoDb } from '../../src/repository/dynamodb/public-order.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('public-orders');
const writer = new OrderRepositoryDynamoDb({ ...config, orderTable: table });
const reader = new PublicOrderRepositoryDynamoDb({ ...config, orderTable: table });

beforeAll(() => createTable(table, 'uuid', undefined, ['timestamp'], [
	{ name: 'customer', partitionKey: 'customerUuid', sortKey: 'timestamp' },
	{ name: 'shortId', partitionKey: 'shortId' },
	{ name: 'status', partitionKey: 'status', sortKey: 'timestamp' },
	{ name: 'store', partitionKey: 'storeId', sortKey: 'timestamp' },
	{ name: 'publicId', partitionKey: 'publicId' }
]));
afterAll(() => deleteTable(table));

describe('PublicOrderRepositoryDynamoDb', () => {
	test('retrieves persisted orders by short id and hides deleted orders', async () => {
		const visible = { uuid: 'visible', storeId: config.storeId, customerUuid: 'customer-1', timestamp: 1, status: 'pending', shortId: 'visible-short' } as OrderDto;
		const deleted = { ...visible, uuid: 'deleted', status: 'deleted', shortId: 'deleted-short' } as OrderDto;
		await writer.storeOrders([visible, deleted]);

		expect(await eventually(() => reader.getOrderByShortId(visible.shortId), Boolean)).toEqual(visible);
		expect(await reader.getOrderByShortId(deleted.shortId)).toBeNull();
	});
});
