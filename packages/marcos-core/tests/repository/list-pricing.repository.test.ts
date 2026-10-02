import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { InvalidKeyError } from '../../src/error/invalid-key.error';
import type { ListPriceDto } from '../../src/repository/dto/list-price.dto';
import { ListPricingRepositoryDynamoDb } from '../../src/repository/dynamodb/list-pricing.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('prices');
const repository = new ListPricingRepositoryDynamoDb({ ...config, listPricingTable: table });
const price = (uuid: string, id: string, type = 'mold'): ListPriceDto =>
	({ uuid, id, type, price: 10 }) as unknown as ListPriceDto;

beforeAll(() => createTable(table, 'uuid', undefined, [], [{ name: 'type', partitionKey: 'type', sortKey: 'id' }]));
afterAll(() => deleteTable(table));

describe('ListPricingRepositoryDynamoDb', () => {
	test('persists, queries, batches and deletes prices', async () => {
		const first = price('price-1', 'A1');
		const second = price('price-2', 'A2');
		await repository.storeListPrice(first);
		await repository.batchStoreListPrices('mold', [second]);

		expect(await repository.getByInternalId(first.uuid)).toEqual(first);
		expect(await eventually(() => repository.getByTypeAndId('mold', 'A1'), Boolean)).toEqual(first);
		expect(await repository.getAllPricesByType('mold')).toEqual(expect.arrayContaining([first, second]));

		await repository.deleteListPrices([first.uuid, second.uuid]);
		expect(await repository.getByInternalId(first.uuid)).toBeNull();
	});

	test('rejects duplicate external identifiers', async () => {
		const existing = price('existing', 'duplicate');
		await repository.storeListPrice(existing);
		await eventually(() => repository.getByTypeAndId('mold', 'duplicate'), Boolean);
		await expect(repository.storeListPrice(price('replacement', 'duplicate'))).rejects.toBeInstanceOf(
			InvalidKeyError
		);
	});
});
