import { test, expect } from '../support/test';
import { runId, uniquePhone } from '../support/fixture';
import { wholeOrder } from '../support/pages/order-form';

const customerName = `Cliente e2e ${runId}`;

test('create an order with the whole form, link it to a new customer and upload a picture', async ({
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
	await expect(page.getByLabel('Teléfono', { exact: true })).toHaveValue('+34');
	await newOrder.linkToNewCustomer(customerName, uniquePhone());

	await filesPage.backToOrder();
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(orderPage.customer(customerName)).toBeVisible();
	await expect(orderPage.receiptWhatsApp()).toHaveAttribute('aria-disabled', 'true');
	await expect(orderPage.printButton()).toBeDisabled();

	await orderPage.openFiles();
	await filesPage.uploadPicture();

	await filesPage.backToOrder();
	await expect(orderPage.receiptWhatsApp()).toHaveAttribute('aria-disabled', 'false');
	await expect(orderPage.receiptWhatsApp()).toHaveAttribute('href', /^https:\/\/wa\.me\//);
	await expect(orderPage.printButton()).toBeEnabled();
	await orderPage.expectDetails(wholeOrder);
});
