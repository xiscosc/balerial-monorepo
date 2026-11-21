import { test, expect } from '@playwright/test';
import { customerWithOnlyQuotes as customer } from './support/fixture';
import { expectWholeOrderDetails, fillWholeOrderForm } from './support/order-form';

test('create an order from a customer found by phone and it is linked straight away', async ({
	page
}) => {
	await page.goto('/customers/search');
	const phone = page.getByLabel('Teléfono:');
	await expect(phone).toHaveValue('+34');
	await phone.click();
	await phone.pressSequentially(customer.phone.slice(3));
	await page.getByRole('button', { name: 'Buscar por teléfono' }).click();

	await page.waitForURL(`/customers/${customer.uuid}`);
	await page.getByRole('button', { name: 'Crear nota' }).click();
	await page.waitForURL(`/customers/${customer.uuid}/orders/new`);
	await fillWholeOrderForm(page);
	await page.getByRole('button', { name: 'Crear pedido' }).click();

	await page.waitForURL(/\/orders\/[^/]+\/files$/);
	const orderId = new URL(page.url()).pathname.split('/')[2];
	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${orderId}`);
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(page.getByRole('button', { name: customer.name, exact: true })).toBeVisible();
	await expectWholeOrderDetails(page);
});
