import { readFileSync } from 'node:fs';

type Row = Record<string, unknown>;

export type Fixture = {
	ORDER_TABLE: (Row & {
		uuid: string;
		shortId: string;
		publicId: string;
		status: string;
		customerUuid: string;
		amountPayed: number;
		invoiced: boolean;
		timestamp: number;
		item: Row & { description: string };
	})[];
	CUSTOMER_TABLE: (Row & { uuid: string; name: string; phone: string })[];
	CALCULATED_ITEM_ORDER_TABLE: (Row & { orderUuid: string })[];
	LIST_PRICING_TABLE: (Row & { id: string; type: string })[];
	CONFIG_TABLE: (Row & { id: string; value: unknown })[];
	FILE_TABLE: (Row & { orderUuid: string })[];
};

export const fixture: Fixture = JSON.parse(
	readFileSync(new URL('../../../marcos-aws/local/fixtures/data.json', import.meta.url), 'utf8')
);

const customerIds = new Set(fixture.CUSTOMER_TABLE.map((c) => c.uuid));
const calculatedOrderIds = new Set(fixture.CALCULATED_ITEM_ORDER_TABLE.map((c) => c.orderUuid));

export const fullOrders = fixture.ORDER_TABLE.filter(
	(o) => customerIds.has(o.customerUuid) && calculatedOrderIds.has(o.uuid)
);

export const ordersNewestFirst = (
	status: string,
	match: (order: Fixture['ORDER_TABLE'][number]) => boolean = () => true
) =>
	fixture.ORDER_TABLE.filter((o) => o.status === status && match(o)).toSorted(
		(a, b) => b.timestamp - a.timestamp
	);

export const newestPendingOrder = fullOrders
	.filter((o) => o.status === 'pending')
	.toSorted((a, b) => b.timestamp - a.timestamp)[0];

export const orderIdsWithFiles = new Set(fixture.FILE_TABLE.map((f) => f.orderUuid));

export const locations = fixture.CONFIG_TABLE.find((c) => c.id === 'locations_config')!
	.value as string[];

export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
