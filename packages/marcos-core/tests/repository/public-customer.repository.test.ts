import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { CustomerDto } from '../../src/repository/dto/customer.dto';
import { CustomerRepositoryDynamoDb } from '../../src/repository/dynamodb/customer.repository.dynamodb';
import { PublicCustomerRepositoryDynamoDb } from '../../src/repository/dynamodb/public-customer.repository.dynamodb';
import { config, createTable, deleteTable, tableName } from './dynamodb-test.utils';

const table = tableName('public-customers');
const writer = new CustomerRepositoryDynamoDb({ ...config, customerTable: table });
const reader = new PublicCustomerRepositoryDynamoDb({ ...config, customerTable: table });

beforeAll(() => createTable(table, 'uuid', undefined, [], [{ name: 'store', partitionKey: 'storeId', sortKey: 'phone' }]));
afterAll(() => deleteTable(table));

describe('PublicCustomerRepositoryDynamoDb', () => {
	test('retrieves a customer persisted by the private repository', async () => {
		const customer = { uuid: 'customer-1', storeId: config.storeId, name: 'Customer', phone: '600000001', normalizedName: 'customer' } as CustomerDto;
		await writer.createCustomer(customer);
		expect(await reader.getCustomerById(customer.uuid)).toEqual(customer);
		expect(await reader.getCustomerById('missing')).toBeNull();
	});
});
