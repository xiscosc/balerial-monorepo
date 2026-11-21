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

export const fixture: Fixture = JSON.parse(
	readFileSync(new URL('../../../marcos-aws/local/fixtures/data.json', import.meta.url), 'utf8')
);

type FixtureOrder = Fixture['ORDER_TABLE'][number];

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

export const newestPendingOrder = fullOrders
	.filter((o) => o.status === 'pending')
	.toSorted((a, b) => b.timestamp - a.timestamp)[0];

export const orderIdsWithFiles = new Set(fixture.FILE_TABLE.map((f) => f.orderUuid));

export const locations = fixture.CONFIG_TABLE.find((c) => c.id === 'locations_config')!
	.value as string[];

export const customerOf = (order: FixtureOrder) =>
	fixture.CUSTOMER_TABLE.find((c) => c.uuid === order.customerUuid)!;

export const elementNames = (order: FixtureOrder) =>
	fixture.CALCULATED_ITEM_ORDER_TABLE.find((c) => c.orderUuid === order.uuid)!.parts.map(
		(p) => p.description
	);

export const pricing = new Map(fixture.LIST_PRICING_TABLE.map((p) => [p.id, p]));
const requiredTypes = [
	['pp'],
	['mold'],
	['glass'],
	['back'],
	['labour', 'fabric'],
	['hanger'],
	['other'],
	['transport']
];
const opensAsCompleteForm = ({ item }: FixtureOrder) => {
	const parts = item.partsToCalculate.map((p) => pricing.get(p.id));
	if (parts.some((p) => p == null)) return false;
	const types = new Set(parts.map((p) => p!.type));
	const hasFloatingMold = parts.some((p) => p!.type === 'mold' && p!.floating);
	return (
		requiredTypes.every((group) => group.some((type) => types.has(type))) &&
		(item.ppDimensions != null || item.pp > 0) &&
		(item.observations.length > 0 || item.predefinedObservations.length > 0) &&
		item.floatingDistance > 0 === hasFloatingMold &&
		(item.dimensionsType !== 'exterior' ||
			(item.exteriorHeight != null && item.exteriorWidth != null))
	);
};

const ordersNotReadByListTests = (status: string) => {
	const byAge = ordersNewestFirst(status);
	const listEnds = new Set([byAge[0].uuid, byAge.at(-1)!.uuid]);
	return fullOrders.filter(
		(o) => o.status === status && !listEnds.has(o.uuid) && !o.item.description.startsWith('Lienzo')
	);
};

const unpaidOrdersReadyToEdit = ordersNotReadByListTests('pending').filter(
	(o) =>
		o.amountPayed === 0 &&
		!o.item.instantDelivery &&
		!orderIdsWithFiles.has(o.uuid) &&
		opensAsCompleteForm(o)
);
export const orderToEdit = unpaidOrdersReadyToEdit.at(-1)!;
export const orderToCopy = unpaidOrdersReadyToEdit.at(-2)!;
export const orderToQuote = ordersNotReadByListTests('pending').find((o) => o.amountPayed > 0)!;
export const quoteToOrder = ordersNotReadByListTests('quote').at(-1)!;

export const customerWithOnlyQuotes = fixture.CUSTOMER_TABLE.find((c) => {
	const orders = fixture.ORDER_TABLE.filter((o) => o.customerUuid === c.uuid);
	return c.uuid !== quoteToOrder.customerUuid && orders.every((o) => o.status === 'quote');
})!;

export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
