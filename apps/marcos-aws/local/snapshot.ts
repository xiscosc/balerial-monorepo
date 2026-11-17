import { mkdirSync, writeFileSync } from 'node:fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocument,
	paginateQuery,
	paginateScan,
	type BatchGetCommandInput,
	type BatchGetCommandOutput,
	type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { OrderSecondaryIndexNames } from '@marcsimolduressonsardina/core/db';

type Item = Record<string, any>;

const SOURCE_ENV = process.env.SOURCE_ENV ?? 'prod';
const MAIN_STORE_ID = process.env.SOURCE_MAIN_STORE_ID;
if (!MAIN_STORE_ID)
	throw new Error('Set SOURCE_MAIN_STORE_ID to the main store id of ' + SOURCE_ENV);

const MONTHS = 1;
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - MONTHS);

const doc = DynamoDBDocument.from(
	new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-central-1' })
);

async function scan(suffix: string, input: Partial<ScanCommandInput> = {}): Promise<Item[]> {
	const items: Item[] = [];
	let page = 0;
	let scanned = 0;
	for await (const result of paginateScan(
		{ client: doc },
		{ TableName: `${SOURCE_ENV}-${suffix}`, ...input }
	)) {
		items.push(...(result.Items ?? []));
		scanned += result.ScannedCount ?? 0;
		console.log(`  ${suffix}: page ${++page}, scanned ${scanned}, kept ${items.length}`);
	}
	return items;
}

async function getByKey(suffix: string, key: string, ids: Set<string>): Promise<Item[]> {
	const TableName = `${SOURCE_ENV}-${suffix}`;
	const all = [...ids].filter(Boolean);
	const items: Item[] = [];
	for (let i = 0; i < all.length; i += 100) {
		let request: BatchGetCommandInput['RequestItems'] = {
			[TableName]: { Keys: all.slice(i, i + 100).map((id) => ({ [key]: id })) }
		};
		while (request && Object.keys(request).length > 0) {
			const result: BatchGetCommandOutput = await doc.batchGet({ RequestItems: request });
			items.push(...(result.Responses?.[TableName] ?? []));
			request = result.UnprocessedKeys;
		}
		console.log(
			`  ${suffix}: ${Math.min(i + 100, all.length)}/${all.length} ids, got ${items.length}`
		);
	}
	return items;
}

function counter() {
	const seen = new Map<unknown, number>();
	return (key: unknown) => {
		if (!seen.has(key)) seen.set(key, seen.size + 1);
		return seen.get(key)!;
	};
}
const customerN = counter();
const phoneN = counter();
const staffN = counter();
const externalStoreN = counter();

const store = (id: string) => (id === MAIN_STORE_ID ? 'local-store' : `ext-${externalStoreN(id)}`);
const stripPhones = (text?: string) => text?.replace(/\+?\d[\d\s.-]{7,}\d/g, '[tel]');

console.log(`Reading ${SOURCE_ENV} since ${cutoff.toISOString().slice(0, 10)}`);
const orders: Item[] = [];
for await (const result of paginateQuery(
	{ client: doc },
	{
		TableName: `${SOURCE_ENV}-order-v2`,
		IndexName: OrderSecondaryIndexNames.Store,
		KeyConditionExpression: 'storeId = :store AND #ts >= :cutoff',
		ExpressionAttributeNames: { '#ts': 'timestamp' },
		ExpressionAttributeValues: { ':store': MAIN_STORE_ID, ':cutoff': cutoff.getTime() }
	}
)) {
	orders.push(...(result.Items ?? []));
	console.log(`  order-v2: ${orders.length} orders`);
}
const customers = await getByKey('customer-v2', 'uuid', new Set(orders.map((o) => o.customerUuid)));
const calculatedItems = await getByKey(
	'calculated-item-order',
	'orderUuid',
	new Set(orders.map((o) => o.uuid))
);
const listPricing = await scan('list-pricing-v2');
const config = await scan('config');

const snapshot = {
	ORDER_TABLE: orders.map((o) => {
		const n = staffN(o.userId);
		return {
			...o,
			userId: `empleado${n}@local.test`,
			userName: `Empleado ${n}`,
			storeId: store(o.storeId),
			item: {
				...o.item,
				description: stripPhones(o.item.description),
				normalizedDescription: stripPhones(o.item.normalizedDescription),
				observations: ''
			}
		};
	}),
	CUSTOMER_TABLE: customers.map((c) => {
		const name = `Cliente ${String(customerN(c.uuid)).padStart(4, '0')}`;
		return {
			...c,
			name,
			normalizedName: name.toLowerCase(),
			phone: `+346${String(phoneN(c.phone)).padStart(8, '0')}`,
			storeId: store(c.storeId)
		};
	}),
	CALCULATED_ITEM_ORDER_TABLE: calculatedItems.map((c) => ({
		...c,
		parts: (c.parts as Item[]).map((p) => ({ ...p, description: stripPhones(p.description) }))
	})),
	LIST_PRICING_TABLE: listPricing,
	CONFIG_TABLE: config.map((c) => ({ ...c, storeId: store(c.storeId) }))
};

const dir = new URL('.data/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('snapshot.json', dir), JSON.stringify(snapshot));

console.log(
	'Wrote .data/snapshot.json:',
	Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, v.length]))
);
