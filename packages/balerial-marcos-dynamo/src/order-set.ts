import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import type { OrderSetDto } from '@marcsimolduressonsardina/contracts/dto';
import { Entity } from 'dynamodb-toolbox/entity';
import { GetItemCommand } from 'dynamodb-toolbox/entity/actions/get';
import { PutItemCommand } from 'dynamodb-toolbox/entity/actions/put';
import { item } from 'dynamodb-toolbox/schema/item';
import { list } from 'dynamodb-toolbox/schema/list';
import { number } from 'dynamodb-toolbox/schema/number';
import { string } from 'dynamodb-toolbox/schema/string';
import { Table } from 'dynamodb-toolbox/table';
import { QueryCommand } from 'dynamodb-toolbox/table/actions/query';
import { createDocumentClient } from './document-client';

const orderSetSchema = item({
	uuid: string().key(),
	hash: string(),
	timestamp: number(),
	userId: string(),
	userName: string(),
	orderIds: list(string())
} satisfies Record<keyof OrderSetDto, unknown>);

export class OrderSetRepositoryDynamoDb {
	private readonly entity;

	constructor(tableName: string | undefined, clientConfig: DynamoDBClientConfig) {
		if (tableName == null) {
			throw new Error('Table name orderSetTable can not be empty');
		}
		if (tableName.length === 0) {
			throw new Error('Table name must be set');
		}

		const table = new Table({
			name: tableName,
			partitionKey: { name: 'uuid', type: 'string' },
			indexes: {
				hash: { type: 'global', partitionKey: { name: 'hash', type: 'string' } }
			},
			documentClient: createDocumentClient(clientConfig)
		});

		this.entity = new Entity({
			name: 'OrderSet',
			table,
			schema: orderSetSchema,
			entityAttribute: false,
			timestamps: false
		});
	}

	async getOrderSetById(orderSetId: string): Promise<OrderSetDto | null> {
		const { Item } = await this.entity.build(GetItemCommand).key({ uuid: orderSetId }).send();
		return Item ?? null;
	}

	async getOrderSetByHash(hash: string): Promise<OrderSetDto | null> {
		const { Items } = await this.entity.table
			.build(QueryCommand)
			.entities(this.entity)
			.query({ index: 'hash', partition: hash })
			.options({ reverse: true, limit: 1 })
			.send();
		return Items?.[0] ?? null;
	}

	async createOrderSet(orderSet: OrderSetDto): Promise<void> {
		if (orderSet.hash == null || orderSet.uuid == null || orderSet.orderIds.length === 0) {
			throw new Error('Invalid order set data');
		}

		await this.entity.build(PutItemCommand).item(orderSet).send();
	}
}
