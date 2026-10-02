import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { OrderAuditTrailEntryDto } from '../../src/repository/dto/order-audit-trail-entry.dto';
import { OrderAuditTrailRepositoryDynamoDb } from '../../src/repository/dynamodb/order-audit-trail.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('order-audit');
const repository = new OrderAuditTrailRepositoryDynamoDb({ ...config, orderAuditTrailTable: table });
const entry = (uuid: string, orderUuid: string, timestamp: number): OrderAuditTrailEntryDto =>
	({ uuid, orderUuid, timestamp, storeId: config.storeId, action: 'updated' }) as unknown as OrderAuditTrailEntryDto;

beforeAll(() => createTable(table, 'uuid', undefined, ['timestamp'], [
	{ name: 'order', partitionKey: 'orderUuid', sortKey: 'timestamp' },
	{ name: 'store', partitionKey: 'storeId', sortKey: 'timestamp' }
]));
afterAll(() => deleteTable(table));

describe('OrderAuditTrailRepositoryDynamoDb', () => {
	test('retrieves persisted entries by order and store timestamp range', async () => {
		const first = entry('audit-1', 'order-1', 100);
		const second = entry('audit-2', 'order-1', 200);
		const outside = entry('audit-3', 'order-2', 300);
		await repository.createOrderAuditTrailEntry(first);
		await repository.createOrderAuditTrailEntry(second);
		await repository.createOrderAuditTrailEntry(outside);

		expect(await eventually(() => repository.getOrderAuditTrailEntriesForOrder('order-1'), (items) => items.length === 2)).toEqual([first, second]);
		expect(await repository.getOrderAuditTrailEntriesBetweenTs(50, 250)).toEqual([first, second]);
	});
});
