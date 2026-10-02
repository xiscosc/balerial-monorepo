import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { ConfigDto } from '../../src/repository/dto/config.dto';
import { ConfigRepositoryDynamoDb } from '../../src/repository/dynamodb/config.repository.dynamodb';
import { config, createTable, deleteTable, tableName } from './dynamodb-test.utils';

const table = tableName('config');
const repository = new ConfigRepositoryDynamoDb({ ...config, configTable: table });

beforeAll(() => createTable(table, 'storeId', 'id'));
afterAll(() => deleteTable(table));

describe('ConfigRepositoryDynamoDb', () => {
	test('persists values for the active store and ignores values for another store', async () => {
		await repository.storeConfigValue({ storeId: config.storeId, id: 'answer', value: 42 } as ConfigDto);
		await repository.storeConfigValue({ storeId: 'other', id: 'answer', value: 99 } as ConfigDto);

		expect(await repository.getConfigValue<number>('answer')).toBe(42);
		expect(await repository.getConfigValue('missing')).toBeNull();
	});
});
