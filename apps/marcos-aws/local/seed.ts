import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	CreateTableCommand,
	DeleteTableCommand,
	waitUntilTableExists,
	waitUntilTableNotExists,
	DynamoDBClient,
	type AttributeDefinition,
	type CreateTableCommandInput,
	type KeySchemaElement
} from '@aws-sdk/client-dynamodb';
import {
	CreateBucketCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	S3Client
} from '@aws-sdk/client-s3';
import { DynamoDBDocument, type BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import type { IDynamoDbIndex } from '@balerial/dynamo/type';
import {
	calculatedItemTableBuilder,
	customerTableBuilder,
	fileTableBuilder,
	listPricingTableBuilder,
	orderTableBuilder
} from '@marcsimolduressonsardina/core/db';
import { configTableKeys } from '../lib/database/config-table';
import { orderAuditTrailTableKeys } from '../lib/database/order-audit-trail-table';
import { orderSetTableKeys } from '../lib/database/order-set-table';

const config = {
	endpoint: 'https://127.0.0.1:9297',
	region: process.env.AWS_REGION,
	credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
};

const legacyTableBuilders = {
	ORDER_TABLE: orderTableBuilder,
	CUSTOMER_TABLE: customerTableBuilder,
	CALCULATED_ITEM_ORDER_TABLE: calculatedItemTableBuilder,
	LIST_PRICING_TABLE: listPricingTableBuilder,
	FILE_TABLE: fileTableBuilder
};

const keySchema = (i: IDynamoDbIndex): KeySchemaElement[] => [
	{ AttributeName: i.partitionKeyName, KeyType: 'HASH' },
	...(i.sortKeyName ? [{ AttributeName: i.sortKeyName, KeyType: 'RANGE' as const }] : [])
];

const attributes = (i: IDynamoDbIndex): AttributeDefinition[] => [
	{ AttributeName: i.partitionKeyName, AttributeType: i.partitionKeyType },
	...(i.sortKeyName && i.sortKeyType
		? [{ AttributeName: i.sortKeyName, AttributeType: i.sortKeyType }]
		: [])
];

const ignoreExisting = (e: unknown) => {
	const name = (e as Error).name;
	if (name !== 'ResourceInUseException' && name !== 'BucketAlreadyOwnedByYou') throw e;
	return 'already exists';
};

const reset = process.env.SEED_RESET === 'true';
const configTableName = process.env.CONFIG_TABLE;
const orderSetTableName = process.env.ORDER_SET_TABLE;
const orderAuditTrailTableName = process.env.ORDER_AUDIT_TRAIL_TABLE;
if (!configTableName || !orderSetTableName || !orderAuditTrailTableName) {
	throw new Error('Table name must be set');
}

const tables: CreateTableCommandInput[] = Object.entries(legacyTableBuilders).map(
	([envKey, builder]) => {
		const table = builder.setTableName(process.env[envKey]!).build();
		const primary = table.getPrimaryIndex();
		const secondary = table.getSecondaryIndexes();
		const attributeDefinitions = [primary, ...secondary].flatMap(attributes);
		return {
			TableName: table.getTableName(),
			BillingMode: 'PAY_PER_REQUEST',
			KeySchema: keySchema(primary),
			AttributeDefinitions: [
				...new Map(attributeDefinitions.map((a) => [a.AttributeName, a])).values()
			],
			GlobalSecondaryIndexes: secondary.length
				? secondary.map((i) => ({
						IndexName: i.indexName,
						KeySchema: keySchema(i),
						Projection: { ProjectionType: 'ALL' }
					}))
				: undefined
		};
	}
);

tables.push({
	TableName: configTableName,
	BillingMode: 'PAY_PER_REQUEST',
	KeySchema: [
		{ AttributeName: configTableKeys.partitionKey, KeyType: 'HASH' },
		{ AttributeName: configTableKeys.sortKey, KeyType: 'RANGE' }
	],
	AttributeDefinitions: [
		{ AttributeName: configTableKeys.partitionKey, AttributeType: 'S' },
		{ AttributeName: configTableKeys.sortKey, AttributeType: 'S' }
	]
});

tables.push({
	TableName: orderSetTableName,
	BillingMode: 'PAY_PER_REQUEST',
	KeySchema: [{ AttributeName: orderSetTableKeys.partitionKey, KeyType: 'HASH' }],
	AttributeDefinitions: [
		{ AttributeName: orderSetTableKeys.partitionKey, AttributeType: 'S' },
		{ AttributeName: orderSetTableKeys.hashIndex.partitionKey, AttributeType: 'S' }
	],
	GlobalSecondaryIndexes: [
		{
			IndexName: orderSetTableKeys.hashIndex.name,
			KeySchema: [{ AttributeName: orderSetTableKeys.hashIndex.partitionKey, KeyType: 'HASH' }],
			Projection: { ProjectionType: 'ALL' }
		}
	]
});

tables.push({
	TableName: orderAuditTrailTableName,
	BillingMode: 'PAY_PER_REQUEST',
	KeySchema: [{ AttributeName: orderAuditTrailTableKeys.partitionKey, KeyType: 'HASH' }],
	AttributeDefinitions: [
		{ AttributeName: orderAuditTrailTableKeys.partitionKey, AttributeType: 'S' },
		{ AttributeName: orderAuditTrailTableKeys.indexSortKey, AttributeType: 'N' },
		...orderAuditTrailTableKeys.indexes.map((index) => ({
			AttributeName: index.partitionKey,
			AttributeType: 'S' as const
		}))
	],
	GlobalSecondaryIndexes: orderAuditTrailTableKeys.indexes.map((index) => ({
		IndexName: index.name,
		KeySchema: [
			{ AttributeName: index.partitionKey, KeyType: 'HASH' },
			{ AttributeName: orderAuditTrailTableKeys.indexSortKey, KeyType: 'RANGE' }
		],
		Projection: { ProjectionType: 'ALL' }
	}))
});

console.log(`Seeding local AWS emulator${reset ? ' (reset)' : ''}`);
const dynamo = new DynamoDBClient(config);
await Promise.all(
	tables.map(async (table) => {
		const { TableName } = table;
		if (reset) {
			await dynamo.send(new DeleteTableCommand({ TableName })).catch((e) => {
				if ((e as Error).name !== 'ResourceNotFoundException') throw e;
			});
			await waitUntilTableNotExists({ client: dynamo, maxWaitTime: 60 }, { TableName });
		}

		const status = await dynamo
			.send(new CreateTableCommand(table))
			.then(() => 'created', ignoreExisting);
		await waitUntilTableExists({ client: dynamo, maxWaitTime: 60 }, { TableName });
		console.log(`  table ${TableName}: ${status}`);
	})
);

const s3 = new S3Client(config);
await Promise.all(
	[process.env.FILES_BUCKET!, process.env.MOLD_PRICES_BUCKET!].map(async (bucket) => {
		const status = await s3
			.send(
				new CreateBucketCommand({
					Bucket: bucket,
					CreateBucketConfiguration: { LocationConstraint: config.region as 'eu-central-1' }
				})
			)
			.then(() => 'created', ignoreExisting);
		if (reset) {
			const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
			if (Contents.length > 0) {
				await s3.send(
					new DeleteObjectsCommand({
						Bucket: bucket,
						Delete: { Objects: Contents.map(({ Key }) => ({ Key })) }
					})
				);
			}
		}
		console.log(`  bucket ${bucket}: ${status}`);
	})
);

const snapshot =
	process.env.SEED_FILE ?? fileURLToPath(new URL('.data/snapshot.json', import.meta.url));
if (!existsSync(snapshot)) {
	console.log(`No ${snapshot}, starting with empty tables (see \`bun run data:snapshot\`)`);
} else {
	console.log(`Loading ${snapshot}`);
	const doc = DynamoDBDocument.from(dynamo);
	const data: Record<string, Record<string, unknown>[]> = JSON.parse(
		readFileSync(snapshot, 'utf8')
	);
	for (const [envKey, items] of Object.entries(data)) {
		const table = process.env[envKey]!;
		for (let i = 0; i < items.length; i += 25) {
			let requestItems: BatchWriteCommandInput['RequestItems'] = {
				[table]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }))
			};
			while (requestItems && Object.keys(requestItems).length > 0) {
				requestItems = (await doc.batchWrite({ RequestItems: requestItems })).UnprocessedItems;
			}
			const done = Math.min(i + 25, items.length);
			if (done % 500 === 0 || done === items.length)
				console.log(`  ${table}: ${done}/${items.length}`);
		}
	}
}
