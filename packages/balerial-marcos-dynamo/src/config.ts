import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import type { ConfigDto } from '@marcsimolduressonsardina/contracts/dto';
import { Entity } from 'dynamodb-toolbox/entity';
import { GetItemCommand } from 'dynamodb-toolbox/entity/actions/get';
import { PutItemCommand } from 'dynamodb-toolbox/entity/actions/put';
import { any } from 'dynamodb-toolbox/schema/any';
import { item } from 'dynamodb-toolbox/schema/item';
import { string } from 'dynamodb-toolbox/schema/string';
import { Table } from 'dynamodb-toolbox/table';
import { createDocumentClient } from './document-client';

// Check field names while preserving the literal key flags inferred by Toolbox.
const configSchema = item({
	storeId: string().key(),
	id: string().key(),
	value: any().castAs<ConfigDto['value']>()
} satisfies Record<keyof ConfigDto, unknown>);

export class ConfigRepositoryDynamoDb {
	private readonly entity;

	constructor(
		tableName: string | undefined,
		private readonly storeId: string,
		clientConfig: DynamoDBClientConfig
	) {
		if (tableName == null) {
			throw new Error('Table name configTable can not be empty');
		}
		if (tableName.length === 0) {
			throw new Error('Table name must be set');
		}

		const table = new Table({
			name: tableName,
			partitionKey: { name: 'storeId', type: 'string' },
			sortKey: { name: 'id', type: 'string' },
			documentClient: createDocumentClient(clientConfig)
		});

		this.entity = new Entity({
			name: 'Config',
			table,
			schema: configSchema,
			entityAttribute: false,
			timestamps: false
		});
	}

	async getConfigValue<T extends ConfigDto['value']>(id: string): Promise<T | null> {
		const { Item }: { Item?: ConfigDto } = await this.entity
			.build(GetItemCommand)
			.key({ storeId: this.storeId, id })
			.send();
		return Item === undefined ? null : (Item.value as T);
	}

	async storeConfigValue(configDto: ConfigDto): Promise<void> {
		if (configDto.storeId !== this.storeId) {
			return;
		}

		await this.entity.build(PutItemCommand).item(configDto).send();
	}
}
