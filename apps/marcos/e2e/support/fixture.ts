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
		notified: boolean;
		timestamp: number;
		item: Row & {
			description: string;
			instantDelivery: boolean;
			partsToCalculate: { id: string }[];
			pp: number;
			ppDimensions?: unknown;
			observations: string;
			predefinedObservations: string[];
			floatingDistance: number;
			dimensionsType: string;
			exteriorHeight?: number;
			exteriorWidth?: number;
		};
	})[];
	CUSTOMER_TABLE: (Row & { uuid: string; name: string; normalizedName: string; phone: string })[];
	CALCULATED_ITEM_ORDER_TABLE: (Row & { orderUuid: string; parts: { description: string }[] })[];
	LIST_PRICING_TABLE: (Row & {
		id: string;
		type: string;
		description: string;
		floating?: boolean;
	})[];
	CONFIG_TABLE: (Row & { id: string; value: unknown })[];
	FILE_TABLE: (Row & { orderUuid: string })[];
};

export type FixtureOrder = Fixture['ORDER_TABLE'][number];
export type FixtureCustomer = Fixture['CUSTOMER_TABLE'][number];

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
	match: (order: FixtureOrder) => boolean = () => true
) =>
	fixture.ORDER_TABLE.filter((o) => o.status === status && match(o)).toSorted(
		(a, b) => b.timestamp - a.timestamp
	);

export const ordersOfCustomer = (customerUuid: string) =>
	fixture.ORDER_TABLE.filter((o) => o.customerUuid === customerUuid);

export const orderIdsWithFiles = new Set(fixture.FILE_TABLE.map((f) => f.orderUuid));

export const locations = fixture.CONFIG_TABLE.find((c) => c.id === 'locations_config')!
	.value as string[];

export const pricing = new Map(fixture.LIST_PRICING_TABLE.map((p) => [p.id, p]));

export const customerOf = (order: FixtureOrder) =>
	fixture.CUSTOMER_TABLE.find((c) => c.uuid === order.customerUuid)!;

export const elementNames = (order: FixtureOrder) =>
	fixture.CALCULATED_ITEM_ORDER_TABLE.find((c) => c.orderUuid === order.uuid)!.parts.map(
		(p) => p.description
	);

export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
