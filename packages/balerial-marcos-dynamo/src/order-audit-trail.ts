import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import type { OrderAuditTrailEntryDto } from '@marcsimolduressonsardina/contracts/dto';
import { Entity } from 'dynamodb-toolbox/entity';
import { PutItemCommand } from 'dynamodb-toolbox/entity/actions/put';
import { any } from 'dynamodb-toolbox/schema/any';
import { item } from 'dynamodb-toolbox/schema/item';
import { number } from 'dynamodb-toolbox/schema/number';
import { string } from 'dynamodb-toolbox/schema/string';
import { Table } from 'dynamodb-toolbox/table';
import { QueryCommand } from 'dynamodb-toolbox/table/actions/query';
import { createDocumentClient } from './document-client';

const orderAuditTrailSchema = item({
	uuid: string().key(),
	orderUuid: string(),
	userId: string(),
	userName: string(),
	storeId: string(),
	type: string(),
	oldValue: any().castAs<OrderAuditTrailEntryDto['oldValue']>().optional(),
	newValue: any().castAs<OrderAuditTrailEntryDto['newValue']>().optional(),
	timestamp: number()
} satisfies Record<keyof OrderAuditTrailEntryDto, unknown>);

export class OrderAuditTrailRepositoryDynamoDb {
	private readonly entity;

	constructor(tableName: string | undefined, clientConfig: DynamoDBClientConfig) {
		if (tableName == null) {
			throw new Error('Table name orderAuditTrailTable can not be empty');
		}
		if (tableName.length === 0) {
			throw new Error('Table name must be set');
		}

		const table = new Table({
			name: tableName,
			partitionKey: { name: 'uuid', type: 'string' },
			indexes: {
				order: {
					type: 'global',
					partitionKey: { name: 'orderUuid', type: 'string' },
					sortKey: { name: 'timestamp', type: 'number' }
				},
				store: {
					type: 'global',
					partitionKey: { name: 'storeId', type: 'string' },
					sortKey: { name: 'timestamp', type: 'number' }
				}
			},
			documentClient: createDocumentClient(clientConfig)
		});

		this.entity = new Entity({
			name: 'OrderAuditTrail',
			table,
			schema: orderAuditTrailSchema,
			entityAttribute: false,
			timestamps: false
		});
	}

	async createOrderAuditTrailEntry(dto: OrderAuditTrailEntryDto): Promise<void> {
		await this.entity.build(PutItemCommand).item(dto).send();
	}

	async getOrderAuditTrailEntriesForOrder(orderUuid: string): Promise<OrderAuditTrailEntryDto[]> {
		const { Items } = await this.entity.table
			.build(QueryCommand)
			.entities(this.entity)
			.query({ index: 'order', partition: orderUuid })
			.options({ reverse: true, maxPages: Infinity })
			.send();
		return Items ?? [];
	}
}
