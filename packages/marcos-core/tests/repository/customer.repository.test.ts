import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { InvalidKeyError } from '../../src/error/invalid-key.error';
import type { CustomerDto } from '../../src/repository/dto/customer.dto';
import { CustomerRepositoryDynamoDb } from '../../src/repository/dynamodb/customer.repository.dynamodb';
import { config, createTable, deleteTable, eventually, tableName } from './dynamodb-test.utils';

const table = tableName('customers');
const repository = new CustomerRepositoryDynamoDb({ ...config, customerTable: table });
const customer = (uuid: string, phone: string, storeId = config.storeId): CustomerDto =>
	({ uuid, phone, storeId, name: `Customer ${uuid}`, normalizedName: `customer ${uuid}` }) as CustomerDto;

beforeAll(() => createTable(table, 'uuid', undefined, [], [{ name: 'store', partitionKey: 'storeId', sortKey: 'phone' }]));
afterAll(() => deleteTable(table));

describe('CustomerRepositoryDynamoDb', () => {
	test('persists, queries, searches, paginates, batches and deletes customers', async () => {
		const first = customer('customer-1', '600000001');
		const second = customer('customer-2', '600000002');
		await repository.storeCustomers([first, second]);

		expect(await repository.getCustomerById(first.uuid)).toEqual(first);
		expect(await eventually(() => repository.getCustomerByPhone(first.phone), Boolean)).toEqual(first);
		expect(await eventually(() => repository.getAllCustomers(), (items) => items.length === 2)).toEqual(
			expect.arrayContaining([first, second])
		);
		expect(await repository.searchCustomer('customer')).toHaveLength(2);
		expect((await repository.getAllCustomersPaginated()).elements).toHaveLength(2);
		expect(await repository.getCustomersByIds([first.uuid, second.uuid])).toEqual({
			[first.uuid]: first,
			[second.uuid]: second
		});

		await repository.deleteCustomer(first);
		expect(await repository.getCustomerById(first.uuid)).toBeUndefined();
	});

	test('enforces store isolation and unique phone numbers', async () => {
		const foreign = customer('foreign', '600000099', 'store-2');
		await expect(repository.storeCustomers([foreign])).rejects.toThrow('Store id does not match');
		await expect(repository.createCustomer(foreign)).rejects.toThrow('Store id does not match');

		await expect(
			repository.createCustomer(customer('duplicate', '600000002'))
		).rejects.toBeInstanceOf(InvalidKeyError);
	});
});
