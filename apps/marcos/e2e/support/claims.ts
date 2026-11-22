import {
	fixture,
	fullOrders,
	orderIdsWithFiles,
	ordersNewestFirst,
	ordersOfCustomer,
	pricing,
	type FixtureCustomer,
	type FixtureOrder
} from './fixture';

const owners = new Map<string, { owner: string; exclusive: boolean }>();
const orderKey = (order: FixtureOrder) => `order:${order.uuid}`;
const customerKey = (uuid: string) => `customer:${uuid}`;

const isFree = (order: FixtureOrder) => !owners.has(orderKey(order));
const isReadable = (order: FixtureOrder) => owners.get(orderKey(order))?.exclusive !== true;
const customerIsFree = (uuid: string) =>
	!owners.has(customerKey(uuid)) && ordersOfCustomer(uuid).every(isFree);

const claimOrders = (owner: string, candidates: FixtureOrder[], count: number) => {
	const free = candidates.filter(isFree);
	if (free.length < count) {
		throw new Error(`Not enough unclaimed seeded orders for "${owner}"`);
	}
	const claimed = free.slice(0, count);
	for (const order of claimed) owners.set(orderKey(order), { owner, exclusive: true });
	return claimed;
};

const readOrders = (owner: string, orders: FixtureOrder[]) => {
	for (const order of orders) {
		if (!isReadable(order)) {
			throw new Error(
				`"${owner}" reads an order claimed by "${owners.get(orderKey(order))!.owner}"`
			);
		}
		owners.set(orderKey(order), owners.get(orderKey(order)) ?? { owner, exclusive: false });
	}
	return orders;
};

const readOrder = (owner: string, candidates: FixtureOrder[]) => {
	const order = candidates.find(isReadable);
	if (order == null) {
		throw new Error(`No readable seeded order for "${owner}"`);
	}
	return readOrders(owner, [order])[0];
};

const claimOrder = (owner: string, candidates: FixtureOrder[]) =>
	claimOrders(owner, candidates, 1)[0];

const claimCustomer = (owner: string, match: (customer: FixtureCustomer) => boolean) => {
	const customer = fixture.CUSTOMER_TABLE.find((c) => customerIsFree(c.uuid) && match(c));
	if (customer == null) {
		throw new Error(`No unclaimed seeded customer for "${owner}"`);
	}
	owners.set(customerKey(customer.uuid), { owner, exclusive: true });
	return customer;
};

const claimTwoOrdersOfOneCustomer = (owner: string, candidates: FixtureOrder[]) => {
	const byCustomer = Map.groupBy(
		candidates.filter((o) => isFree(o) && customerIsFree(o.customerUuid)),
		(o) => o.customerUuid
	);
	const entry = [...byCustomer].find(([, orders]) => orders.length >= 2);
	if (entry == null) {
		throw new Error(`No unclaimed seeded customer with two orders for "${owner}"`);
	}
	const [customerUuid, orders] = entry;
	owners.set(customerKey(customerUuid), { owner, exclusive: true });
	return { customerUuid, orders: claimOrders(owner, orders, 2) };
};

const isUnlinked = (o: FixtureOrder) => o.customerUuid === 'temp-customer';
const withStatus = (status: string) => (o: FixtureOrder) => o.status === status;
const unpaid = (o: FixtureOrder) => o.amountPayed === 0;
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

export const listSearchTerm = 'Lienzo';
const matchesListSearch = (o: FixtureOrder) => o.item.description.startsWith(listSearchTerm);

export const receipt = {
	order: readOrder(
		'receipt',
		fullOrders.filter((o) => withStatus('pending')(o) && unpaid(o))
	),
	quote: readOrder('receipt', fullOrders.filter(withStatus('quote')))
};

export const newestPendingOrder = readOrder(
	'order list',
	fullOrders.filter(withStatus('pending')).toSorted((a, b) => b.timestamp - a.timestamp)
);

const ordersShownFirstOrLastInTheList = ['pending', 'finished', 'picked_up'].flatMap((status) => {
	const all = ordersNewestFirst(status);
	const searched = ordersNewestFirst(status, matchesListSearch);
	return [all[0], all.at(-1), searched[0], searched.at(-1)].filter((o) => o != null);
});
readOrders('order list', [
	...ordersShownFirstOrLastInTheList,
	...ordersNewestFirst('pending', isUnlinked)
]);

const notInListSearch = fullOrders.filter((o) => !matchesListSearch(o));

export const orderToFinish = claimOrder(
	'order status',
	notInListSearch
		.filter(
			(o) =>
				withStatus('pending')(o) &&
				unpaid(o) &&
				!o.invoiced &&
				orderIdsWithFiles.has(o.uuid) &&
				ordersOfCustomer(o.customerUuid).filter((x) => x.status !== 'quote').length === 1
		)
		.toReversed()
);

const newestPickedUp = ordersNewestFirst('picked_up')[0].timestamp;
const finishedNotNewerThanPickedUp = (match: (o: FixtureOrder) => boolean) =>
	fullOrders.filter((o) => withStatus('finished')(o) && o.timestamp < newestPickedUp && match(o));

export const bulk = {
	toNotify: claimTwoOrdersOfOneCustomer(
		'bulk notify',
		finishedNotNewerThanPickedUp((o) => !o.notified)
	),
	toPay: claimTwoOrdersOfOneCustomer('bulk pay', finishedNotNewerThanPickedUp(unpaid)),
	toInvoice: claimTwoOrdersOfOneCustomer(
		'bulk invoice',
		finishedNotNewerThanPickedUp((o) => !o.invoiced)
	),
	toPickUp: claimTwoOrdersOfOneCustomer(
		'bulk pick up',
		finishedNotNewerThanPickedUp(() => true)
	),
	toPrint: claimTwoOrdersOfOneCustomer(
		'bulk print',
		finishedNotNewerThanPickedUp(() => true)
	)
};

const unpaidPendingThatOpensComplete = notInListSearch
	.filter(
		(o) =>
			withStatus('pending')(o) &&
			unpaid(o) &&
			!o.item.instantDelivery &&
			!orderIdsWithFiles.has(o.uuid) &&
			opensAsCompleteForm(o)
	)
	.toReversed();

export const orderToEdit = claimOrder('order edit', unpaidPendingThatOpensComplete);
export const orderToDuplicate = claimOrder('order duplicate', unpaidPendingThatOpensComplete);
export const paidOrderToQuote = claimOrder(
	'order to quote',
	notInListSearch.filter((o) => withStatus('pending')(o) && o.amountPayed > 0)
);
export const quoteToOrder = claimOrder(
	'quote to order',
	notInListSearch.filter(withStatus('quote')).toReversed()
);

export const orderToDelete = claimOrder(
	'order delete',
	notInListSearch.filter(withStatus('pending'))
);
export const orderStaffCannotDelete = readOrder(
	'order delete by staff',
	notInListSearch.filter(withStatus('pending'))
);

export const orderToFinishAtNewLocation = claimOrder(
	'new location',
	notInListSearch.filter(withStatus('pending'))
);

const dayIn = (timeZone: string) => {
	const format = new Intl.DateTimeFormat('en-CA', { timeZone });
	return (timestamp: number) => format.format(timestamp);
};
const utcDay = dayIn('UTC');
const madridDay = dayIn('Europe/Madrid');
const fullOrderIds = new Set(fullOrders.map((o) => o.uuid));

const sameDayOrderGroups = fixture.CUSTOMER_TABLE.flatMap((customer) => {
	const orders = ordersOfCustomer(customer.uuid);
	return [...Map.groupBy(orders, (o) => utcDay(o.timestamp)).values()]
		.filter((group) => {
			const days = new Set(group.map((o) => madridDay(o.timestamp)));
			const [day] = days;
			return (
				days.size === 1 &&
				orders.filter((o) => madridDay(o.timestamp) === day).length === group.length
			);
		})
		.map((group) => group.filter((o) => o.status !== 'quote'))
		.filter((group) => group.length >= 2 && group.every((o) => fullOrderIds.has(o.uuid)));
});

const claimSameDayGroup = (owner: string, match: (group: FixtureOrder[]) => boolean) => {
	const group = sameDayOrderGroups.find(
		(g) => g.every(isFree) && customerIsFree(g[0].customerUuid) && match(g)
	);
	if (group == null) {
		throw new Error(`No unclaimed same-day orders for "${owner}"`);
	}
	owners.set(customerKey(group[0].customerUuid), { owner, exclusive: true });
	return claimOrders(owner, group, group.length);
};

export const sameDayWithPending = claimSameDayGroup(
	'same day with pending',
	(g) => g.some(withStatus('finished')) && g.some(withStatus('pending'))
);
export const sameDayAllFinished = claimSameDayGroup('same day all finished', (g) =>
	g.every(withStatus('finished'))
);

export const orderToPrint = readOrder(
	'order print',
	fullOrders.filter((o) => withStatus('pending')(o) && orderIdsWithFiles.has(o.uuid))
);
export const orderToLookUp = readOrder('order lookup', fullOrders.filter(withStatus('finished')));
export const tracking = {
	order: readOrder(
		'tracking',
		fullOrders.filter((o) => withStatus('pending')(o) && !o.item.instantDelivery)
	),
	quote: readOrder('tracking', fullOrders.filter(withStatus('quote')))
};

export const customerWithOnlyQuotes = claimCustomer('order for customer', (c) =>
	ordersOfCustomer(c.uuid).every((o) => o.status === 'quote')
);
export const customerWithOrders = claimCustomer(
	'customer management',
	(c) => ordersOfCustomer(c.uuid).length > 0
);
