import { existsSync, readFileSync } from 'node:fs';
import {
	CreateTableCommand,
	waitUntilTableExists,
	DynamoDBClient,
	type AttributeDefinition,
	type KeySchemaElement
} from '@aws-sdk/client-dynamodb';
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocument, type BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import type { IDynamoDbIndex } from '@balerial/dynamo/type';
import {
	calculatedItemTableBuilder,
	configTableBuilder,
	customerTableBuilder,
	fileTableBuilder,
	listPricingTableBuilder,
	orderAuditTrailTableBuilder,
	orderSetTableBuilder,
	orderTableBuilder
} from '@marcsimolduressonsardina/core/db';

const config = {
	endpoint: 'https://127.0.0.1:9297',
	region: process.env.AWS_REGION,
	credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
};

const tables = {
	ORDER_TABLE: orderTableBuilder,
	CUSTOMER_TABLE: customerTableBuilder,
	CALCULATED_ITEM_ORDER_TABLE: calculatedItemTableBuilder,
	LIST_PRICING_TABLE: listPricingTableBuilder,
	FILE_TABLE: fileTableBuilder,
	CONFIG_TABLE: configTableBuilder,
	ORDER_SET_TABLE: orderSetTableBuilder,
	ORDER_AUDIT_TRAIL_TABLE: orderAuditTrailTableBuilder
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

console.log('Seeding local AWS emulator');
const dynamo = new DynamoDBClient(config);
for (const [envKey, builder] of Object.entries(tables)) {
	const table = builder.setTableName(process.env[envKey]!).build();
	const primary = table.getPrimaryIndex();
	const secondary = table.getSecondaryIndexes();
	const attributeDefinitions = [primary, ...secondary].flatMap(attributes);

	const status = await dynamo
		.send(
			new CreateTableCommand({
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
			})
		)
		.then(() => 'created', ignoreExisting);
	await waitUntilTableExists(
		{ client: dynamo, maxWaitTime: 60 },
		{ TableName: table.getTableName() }
	);
	console.log(`  table ${table.getTableName()}: ${status}`);
}

const s3 = new S3Client(config);
for (const bucket of [process.env.FILES_BUCKET!, process.env.MOLD_PRICES_BUCKET!]) {
	const status = await s3
		.send(
			new CreateBucketCommand({
				Bucket: bucket,
				CreateBucketConfiguration: { LocationConstraint: config.region as 'eu-central-1' }
			})
		)
		.then(() => 'created', ignoreExisting);
	console.log(`  bucket ${bucket}: ${status}`);
}

const snapshot = new URL('.data/snapshot.json', import.meta.url);
if (!existsSync(snapshot)) {
	console.log('No .data/snapshot.json, starting with empty tables (see `bun run data:snapshot`)');
} else {
	console.log('Loading .data/snapshot.json');
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
