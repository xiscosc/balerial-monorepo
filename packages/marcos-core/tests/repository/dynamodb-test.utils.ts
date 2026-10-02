import {
	CreateTableCommand,
	DeleteTableCommand,
	DynamoDBClient,
	waitUntilTableExists,
	type AttributeDefinition,
	type GlobalSecondaryIndex,
	type KeySchemaElement
} from '@aws-sdk/client-dynamodb';
import type { ICoreConfiguration } from '../../src/configuration/core-configuration.interface';

export const endpoint = 'http://127.0.0.1:4566';
process.env.AWS_ENDPOINT_URL_DYNAMODB = endpoint;

const clientConfig = {
	endpoint,
	region: 'local',
	credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
};
const client = new DynamoDBClient(clientConfig);

export const config: ICoreConfiguration = {
	storeId: 'store-1',
	runInAWSLambda: false,
	region: clientConfig.region,
	credentials: clientConfig.credentials,
	user: { id: 'integration-test' }
} as ICoreConfiguration;

export function tableName(subject: string): string {
	return `marcos-core-${subject}-${crypto.randomUUID()}`;
}

interface IndexDefinition {
	name: string;
	partitionKey: string;
	sortKey?: string;
}

export async function createTable(
	name: string,
	partitionKey: string,
	sortKey?: string,
	numberAttributes: string[] = [],
	indexes: IndexDefinition[] = []
): Promise<void> {
	const keys = new Set([partitionKey, sortKey, ...indexes.flatMap((index) => [index.partitionKey, index.sortKey])].filter(Boolean) as string[]);
	const attributes: AttributeDefinition[] = [...keys].map((AttributeName) => ({
		AttributeName,
		AttributeType: numberAttributes.includes(AttributeName) ? 'N' : 'S'
	}));
	const keySchema: KeySchemaElement[] = [
		{ AttributeName: partitionKey, KeyType: 'HASH' },
		...(sortKey ? [{ AttributeName: sortKey, KeyType: 'RANGE' as const }] : [])
	];
	const globalSecondaryIndexes: GlobalSecondaryIndex[] = indexes.map((index) => ({
		IndexName: index.name,
		KeySchema: [
			{ AttributeName: index.partitionKey, KeyType: 'HASH' },
			...(index.sortKey
				? [{ AttributeName: index.sortKey, KeyType: 'RANGE' as const }]
				: [])
		],
		Projection: { ProjectionType: 'ALL' }
	}));

	await client.send(
		new CreateTableCommand({
			TableName: name,
			AttributeDefinitions: attributes,
			KeySchema: keySchema,
			BillingMode: 'PAY_PER_REQUEST',
			GlobalSecondaryIndexes: globalSecondaryIndexes.length ? globalSecondaryIndexes : undefined
		})
	);
	await waitUntilTableExists({ client, maxWaitTime: 20 }, { TableName: name });
}

export async function deleteTable(name: string): Promise<void> {
	await client.send(new DeleteTableCommand({ TableName: name }));
}

export async function eventually<T>(read: () => Promise<T>, accept: (value: T) => boolean): Promise<T> {
	const timeout = Date.now() + 5_000;
	let value = await read();
	while (!accept(value) && Date.now() < timeout) {
		await Bun.sleep(50);
		value = await read();
	}
	return value;
}
