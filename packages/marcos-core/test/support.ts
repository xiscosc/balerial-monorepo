import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import type { ICoreConfiguration } from '../src/configuration/core-configuration.interface';
import { PUBLIC_REPOSITORY } from '../src/configuration/core-configuration.interface';
import type {
	CalculatedItemDto,
	ConfigDto,
	CustomerDto,
	FileDto,
	ListPriceDto,
	OrderDto
} from '@marcsimolduressonsardina/contracts/dto';
import { ServiceFactory } from '../src/service/service-factory';
import type { OrderCreationDto } from '../src/service/dto/order-creation.dto';
import type { FullOrder } from '@marcsimolduressonsardina/contracts/type';
import { cornersId, otherExtraId } from '../src/utilities/calculated-item.utilites';
import { quoteDeliveryDate, tempCustomerUuid } from '../src/utilities/order.utilities';
import data from '../../../apps/marcos-aws/local/fixtures/data.json';

for (const [key, value] of Object.entries(
	parseEnv(readFileSync(join(__dirname, '../.env.test'), 'utf8'))
)) {
	process.env[key] = value;
}

export const fixture = data as unknown as {
	ORDER_TABLE: OrderDto[];
	CUSTOMER_TABLE: CustomerDto[];
	CALCULATED_ITEM_ORDER_TABLE: CalculatedItemDto[];
	LIST_PRICING_TABLE: ListPriceDto[];
	CONFIG_TABLE: ConfigDto[];
	FILE_TABLE?: FileDto[];
};

export const STORE = 'local-store';
export const liveOrders = fixture.ORDER_TABLE.filter((o) => o.status !== 'deleted');
export const deletedOrders = fixture.ORDER_TABLE.filter((o) => o.status === 'deleted');
export const customersById = new Map(fixture.CUSTOMER_TABLE.map((c) => [c.uuid, c]));
export const linkedOrders = liveOrders.filter((o) => customersById.has(o.customerUuid));
export const tempOrders = liveOrders.filter((o) => o.customerUuid === tempCustomerUuid);
export const locations = fixture.CONFIG_TABLE.find((c) => c.id === 'locations_config')!
	.value as string[];
export const calculatedItemOf = (orderUuid: string) =>
	fixture.CALCULATED_ITEM_ORDER_TABLE.find((c) => c.orderUuid === orderUuid)!;
export const sortedIds = (orders: { id: string }[]) => orders.map((o) => o.id).sort();
export const fixtureIds = (orders: OrderDto[]) => orders.map((o) => o.uuid).sort();

export const expectedTotal = ({ parts, discount, quantity }: CalculatedItemDto) => {
	const unit = parts.reduce(
		(sum, p) => sum + p.price * p.quantity * (p.discountAllowed !== false ? 1 - discount / 100 : 1),
		0
	);
	return (Math.ceil(unit * 100) / 100) * quantity;
};

export const groupBy = <T, K>(items: T[], key: (item: T) => K) => {
	const groups = new Map<K, T[]>();
	for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
	return groups;
};

export const config = (overrides: Partial<ICoreConfiguration> = {}): ICoreConfiguration => ({
	storeId: STORE,
	user: { id: 'empleado1@local.test', name: 'Empleado 1', storeId: STORE, priceManager: true },
	region: process.env.AWS_REGION!,
	credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
	orderTable: process.env.ORDER_TABLE,
	customerTable: process.env.CUSTOMER_TABLE,
	calculatedItemTable: process.env.CALCULATED_ITEM_ORDER_TABLE,
	listPricingTable: process.env.LIST_PRICING_TABLE,
	fileTable: process.env.FILE_TABLE,
	configTable: process.env.CONFIG_TABLE,
	orderSetTable: process.env.ORDER_SET_TABLE,
	orderAuditTrailTable: process.env.ORDER_AUDIT_TRAIL_TABLE,
	filesBucket: process.env.FILES_BUCKET,
	moldPricesBucket: process.env.MOLD_PRICES_BUCKET,
	...overrides
});

export const services = () => ServiceFactory.create(config());

export const publicServices = () =>
	ServiceFactory.createPublic({
		...config(),
		storeId: PUBLIC_REPOSITORY,
		user: { id: 'public', name: 'public', storeId: PUBLIC_REPOSITORY, priceManager: false }
	});

export const formDtoFrom = (
	{ order, calculatedItem }: FullOrder,
	isQuote: boolean,
	customerId?: string
): OrderCreationDto => ({
	width: order.item.width,
	height: order.item.height,
	pp: order.item.pp ?? 0,
	floatingDistance: order.item.floatingDistance,
	description: order.item.description,
	predefinedObservations: order.item.predefinedObservations,
	observations: order.item.observations,
	quantity: order.item.quantity,
	deliveryDate: isQuote || order.item.instantDelivery ? quoteDeliveryDate : order.item.deliveryDate,
	partsToCalculate: order.item.partsToCalculate.map((p) => ({ ...p })),
	extraParts: calculatedItem.parts.filter((p) => [cornersId, otherExtraId].includes(p.priceId)),
	discount: calculatedItem.discount,
	hasArrow: order.hasArrow,
	ppDimensions: order.item.ppDimensions,
	exteriorWidth: order.item.dimensionsType === 'exterior' ? order.item.exteriorWidth : undefined,
	exteriorHeight: order.item.dimensionsType === 'exterior' ? order.item.exteriorHeight : undefined,
	dimensionsType: order.item.dimensionsType,
	instantDelivery: order.item.instantDelivery,
	isQuote,
	customerId
});

// Facts of the fixture month: molds deleted from the list, and prices changed after the order
export const deletedMolds = new Set(['723_M1454', '5250_M1455', '5221_M1456']);
export const repriced: Record<string, { stored: number; now: number }> = {
	'7424a031-1db1-4849-96e8-3c99e8264ab7|5077_M0021': { stored: 24.6, now: 25.83 },
	'1e63fc0b-1a95-42d5-be98-27a6774b2b62|OTHER_034': { stored: 4, now: 4.83 },
	'9c3cab51-d7a1-41cd-a982-3be30a3905be|OTHER_034': { stored: 4, now: 4.83 },
	'57c370cf-1e84-4450-a6a1-544cbd7c050a|OTHER_034': { stored: 4, now: 4.83 },
	'83226d16-32cb-4207-8324-08cb2b6a237e|OTHER_034': { stored: 4, now: 4.83 },
	'88ec1691-f61a-46c2-9bad-f67df956f5f5|OTHER_034': { stored: 4, now: 4.83 }
};
export const pricedAsStored = (order: OrderDto) =>
	!order.item.partsToCalculate.some(
		(p) => deletedMolds.has(p.id) || repriced[`${order.uuid}|${p.id}`] != null
	);

const reserved = new Set<string>();
export const reserve = (count: number, predicate: (o: OrderDto) => boolean) => {
	const picked = liveOrders.filter((o) => !reserved.has(o.uuid) && predicate(o)).slice(0, count);
	if (picked.length < count)
		throw new Error(`fixture has only ${picked.length} free orders for this`);
	picked.forEach((o) => reserved.add(o.uuid));
	return picked;
};

export const randomPhone = () => `+346${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
export const randomName = () => `Cliente ${crypto.randomUUID().slice(0, 8)}`;

export const reserveSameCustomer = (count: number) => {
	const free = liveOrders.filter((o) => !reserved.has(o.uuid) && customersById.has(o.customerUuid));
	const [customerUuid] = [...groupBy(free, (o) => o.customerUuid)].find(
		([, o]) => o.length >= count
	)!;
	return reserve(count, (o) => o.customerUuid === customerUuid);
};

export const inBatches = async <T>(items: T[], check: (item: T) => Promise<unknown>, size = 25) => {
	for (let i = 0; i < items.length; i += size) {
		await Promise.all(items.slice(i, i + size).map(check));
	}
};
