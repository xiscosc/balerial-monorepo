import { test, expect } from '../support/test';
import { customerWithOnlyQuotes as customer } from '../support/claims';
import { nationalNumber, typePhone } from '../support/pages/customer-form';
import { wholeOrder } from '../support/pages/order-form';

test('create an order from a customer found by phone and it is linked straight away', async ({
	page,
	open,
	orderForm,
	newOrder,
	filesPage,
	orderPage
}) => {
	await open('/customers/search');
	await typePhone(page.getByLabel('Teléfono:'), nationalNumber(customer.phone));
	await page.getByRole('button', { name: 'Buscar por teléfono' }).click();

	await page.waitForURL(`/customers/${customer.uuid}`);
	await page.getByRole('button', { name: 'Crear nota' }).click();
	await page.waitForURL(`/customers/${customer.uuid}/orders/new`);
	await orderForm.fillWholeOrder();
	const orderId = await newOrder.create();

	await expect(page).toHaveURL(`/orders/${orderId}/files`);
	await filesPage.backToOrder();
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(orderPage.customer(customer.name)).toBeVisible();
	await orderPage.expectDetails(wholeOrder);
});
