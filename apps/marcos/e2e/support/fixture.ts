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
	})[];
	CUSTOMER_TABLE: (Row & { uuid: string; name: string; phone: string })[];
	CALCULATED_ITEM_ORDER_TABLE: (Row & { orderUuid: string })[];
	LIST_PRICING_TABLE: (Row & { id: string; type: string })[];
	CONFIG_TABLE: (Row & { id: string; value: unknown })[];
	FILE_TABLE?: Row[];
};

export const fixture: Fixture = JSON.parse(
	readFileSync(new URL('../../../marcos-aws/local/fixtures/data.json', import.meta.url), 'utf8')
);

const customerIds = new Set(fixture.CUSTOMER_TABLE.map((c) => c.uuid));
const calculatedOrderIds = new Set(fixture.CALCULATED_ITEM_ORDER_TABLE.map((c) => c.orderUuid));

export const fullOrders = fixture.ORDER_TABLE.filter(
	(o) => customerIds.has(o.customerUuid) && calculatedOrderIds.has(o.uuid)
);

export const locations = fixture.CONFIG_TABLE.find((c) => c.id === 'locations_config')!
	.value as string[];

export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
