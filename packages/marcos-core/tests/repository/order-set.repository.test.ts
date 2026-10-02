import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { OrderSetDto } from '../../src/repository/dto/order-set.dto';
import { OrderSetRepositoryDynamoDb } from '../../src/repository/dynamodb/order-set.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('order-sets');
const repository = new OrderSetRepositoryDynamoDb({ ...config, orderSetTable: table });

beforeAll(() => createTable(table, 'uuid', undefined, [], [{ name: 'hash', partitionKey: 'hash' }]));
afterAll(() => deleteTable(table));

describe('OrderSetRepositoryDynamoDb', () => {
	test('persists order sets and retrieves them by id and hash', async () => {
		const set = { uuid: 'set-1', hash: 'hash-1', orderIds: ['order-1'] } as OrderSetDto;
		await repository.createOrderSet(set);
		expect(await repository.getOrderSetById(set.uuid)).toEqual(set);
		expect(await eventually(() => repository.getOrderSetByHash(set.hash), Boolean)).toEqual(set);
	});

	test('rejects empty order sets', async () => {
		await expect(repository.createOrderSet({ uuid: 'invalid', hash: 'hash', orderIds: [] } as OrderSetDto)).rejects.toThrow('Invalid order set data');
	});
});
