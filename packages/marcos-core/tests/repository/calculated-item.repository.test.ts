import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { CalculatedItemDto } from '../../src/repository/dto/calculated-item.dto';
import { CalculatedItemRepositoryDynamoDb } from '../../src/repository/dynamodb/calculated-item.repository.dynamodb';
import { config, createTable, deleteTable, tableName } from './dynamodb-test.utils';

const table = tableName('calculated-items');
const repository = new CalculatedItemRepositoryDynamoDb({ ...config, calculatedItemTable: table });

beforeAll(() => createTable(table, 'orderUuid'));
afterAll(() => deleteTable(table));

describe('CalculatedItemRepositoryDynamoDb', () => {
	test('persists and retrieves calculated items individually and in batches', async () => {
		const first = { orderUuid: 'order-1', total: 12 } as unknown as CalculatedItemDto;
		const second = { orderUuid: 'order-2', total: 20 } as unknown as CalculatedItemDto;
		await repository.createCalculatedItem(first);
		await repository.createCalculatedItem(second);

		expect(await repository.getCalculatedItemById('order-1')).toEqual(first);
		expect(await repository.getCalculatedItemById('missing')).toBeNull();
		expect(await repository.getCalculatedItemsByIds(['order-1', 'order-2'])).toEqual({
			'order-1': first,
			'order-2': second
		});
	});
});
