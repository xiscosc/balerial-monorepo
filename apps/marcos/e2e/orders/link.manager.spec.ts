import { test, expect } from '../support/test';
import { customerToLinkByName as customer } from '../support/claims';

test('link a new order to an existing customer found by name', async ({
	page,
	orderForm,
	newOrder,
	filesPage,
	orderPage
}) => {
	await page.goto('/orders/new');
	await orderForm.fillWholeOrder();
	const orderId = await newOrder.create();

	await expect(page).toHaveURL(`/orders/${orderId}/link`);
	await page.getByPlaceholder('Nombre a buscar...').pressSequentially(customer.name);
	await page.getByRole('button', { name: customer.name, exact: true }).click();

	await page.waitForURL(`/orders/${orderId}/files`);
	await filesPage.backToOrder();
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(orderPage.customer(customer.name)).toBeVisible();
});
