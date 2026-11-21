import { test, expect, type Page } from '@playwright/test';
import { fullOrders, ordersNewestFirst } from './support/fixture';

type FixtureOrder = (typeof fullOrders)[number];

const isLienzo = (o: FixtureOrder) => o.item.description.startsWith('Lienzo');
const readByListTests = new Set(
	[
		ordersNewestFirst('finished')[0],
		ordersNewestFirst('finished').at(-1)!,
		ordersNewestFirst('finished', isLienzo)[0],
		ordersNewestFirst('finished', isLienzo).at(-1)!
	].map((o) => o.uuid)
);
const newestPickedUp = ordersNewestFirst('picked_up')[0].timestamp;

const usedCustomers = new Set<string>();
const twoFinishedOrdersOfOneCustomer = (eligible: (o: FixtureOrder) => boolean) => {
	const byCustomer = new Map<string, FixtureOrder[]>();
	for (const o of fullOrders) {
		if (
			o.status === 'finished' &&
			!readByListTests.has(o.uuid) &&
			o.timestamp < newestPickedUp &&
			!usedCustomers.has(o.customerUuid) &&
			eligible(o)
		) {
			byCustomer.set(o.customerUuid, [...(byCustomer.get(o.customerUuid) ?? []), o]);
		}
	}
	const [customerUuid, orders] = [...byCustomer].find(([, os]) => os.length >= 2)!;
	usedCustomers.add(customerUuid);
	return { customerUuid, orders: orders.slice(0, 2) };
};

const toNotify = twoFinishedOrdersOfOneCustomer((o) => !o.notified);
const toPay = twoFinishedOrdersOfOneCustomer((o) => o.amountPayed === 0);
const toInvoice = twoFinishedOrdersOfOneCustomer((o) => !o.invoiced);
const toPickUp = twoFinishedOrdersOfOneCustomer(() => true);
const toPrint = twoFinishedOrdersOfOneCustomer(() => true);

const card = (page: Page, order: FixtureOrder) =>
	page
		.locator('div')
		.filter({ has: page.getByText(order.item.description, { exact: true }) })
		.filter({ has: page.getByRole('button', { name: order.publicId }) })
		.last();

const selectOrders = async (page: Page, customerUuid: string, orders: FixtureOrder[]) => {
	await page.goto(`/customers/${customerUuid}/orders`);
	await page.getByRole('button', { name: orders[0].publicId }).click();
	for (const order of orders.slice(1)) {
		await card(page, order).getByRole('checkbox').click();
	}
	await expect(page.getByText(new RegExp(`^${orders.length}/\\d+$`))).toBeVisible();
};

const runBulkOperation = async (page: Page, action: string, confirm: string) => {
	await page.getByRole('button', { name: action }).click();
	const dialog = page.getByRole('dialog', { name: 'Operaciones en lote' });
	await Promise.all([
		page.waitForResponse(
			(r) => r.url().endsWith('/api/orders') && r.request().method() === 'PATCH' && r.ok()
		),
		dialog.getByRole('button', { name: confirm }).click()
	]);
	return dialog;
};

test('notify finished orders in bulk', async ({ page }) => {
	await selectOrders(page, toNotify.customerUuid, toNotify.orders);
	const dialog = await runBulkOperation(
		page,
		'Notificar pedidos',
		'Notificar pedidos (sólo finalizados)'
	);
	await expect(
		dialog.getByRole('link', { name: 'Enviar mensaje todos finalizados' })
	).toHaveAttribute('href', /^https:\/\/wa\.me\//);

	for (const order of toNotify.orders) {
		await page.goto(`/orders/${order.uuid}`);
		await expect(page.getByText('Cliente avisado')).toBeVisible();
	}
});

test('mark orders as paid in bulk', async ({ page }) => {
	await selectOrders(page, toPay.customerUuid, toPay.orders);
	await runBulkOperation(page, 'Marcar como pagados', 'Marcar pedidos como pagados');

	await page.reload();
	for (const order of toPay.orders) {
		await expect(card(page, order).getByText('Sí', { exact: true })).toBeVisible();
	}
});

test('mark orders as invoiced in bulk', async ({ page }) => {
	await selectOrders(page, toInvoice.customerUuid, toInvoice.orders);
	await runBulkOperation(page, 'Marcar como facturados', 'Marcar pedidos como facturados');

	for (const order of toInvoice.orders) {
		await page.goto(`/orders/${order.uuid}`);
		await expect(page.getByRole('button', { name: 'Facturado', exact: true })).toBeVisible();
	}
});

test('mark finished orders as picked up in bulk', async ({ page }) => {
	await selectOrders(page, toPickUp.customerUuid, toPickUp.orders);
	await runBulkOperation(page, 'Marcar como recogidos', 'Marcar pedidos como recogidos');

	await page.reload();
	for (const order of toPickUp.orders) {
		await expect(card(page, order).getByText('Recogido', { exact: true })).toBeVisible();
	}
});

test('print a list of the selected orders', async ({ page }) => {
	await selectOrders(page, toPrint.customerUuid, toPrint.orders);
	await page.getByRole('button', { name: 'Imprimir listado' }).click();

	await page.waitForURL(/\/order-sets\/[^/]+\/print$/);
	for (const order of toPrint.orders) {
		await expect(page.getByText(order.publicId, { exact: true })).toBeVisible();
	}
});
