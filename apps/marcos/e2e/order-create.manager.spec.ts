import { test, expect } from '@playwright/test';
import { runId, uniquePhone } from './support/fixture';
import { expectWholeOrderDetails, fillWholeOrderForm } from './support/order-form';

const customerName = `Cliente e2e ${runId}`;
const picture = {
	name: 'obra.png',
	mimeType: 'image/png',
	buffer: Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
		'base64'
	)
};

test('create an order with the whole form, link it to a new customer and upload a picture', async ({
	page
}) => {
	await page.goto('/orders/new');
	await fillWholeOrderForm(page);
	await page.getByRole('button', { name: 'Crear pedido' }).click();

	await page.waitForURL(/\/orders\/[^/]+\/link$/);
	const orderId = new URL(page.url()).pathname.split('/')[2];
	await page.getByLabel('Nombre', { exact: true }).fill(customerName);
	const phone = page.getByLabel('Teléfono', { exact: true });
	await expect(phone).toHaveValue('+34');
	await phone.click();
	await phone.pressSequentially(uniquePhone());
	await page.getByRole('button', { name: 'Vincular', exact: true }).click();

	const whatsapp = page.getByRole('link', { name: 'Enviar resguardo' });
	const print = page.locator('button', { hasText: 'Imprimir' });

	await page.waitForURL(`/orders/${orderId}/files`);
	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${orderId}`);
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(page.getByRole('button', { name: customerName })).toBeVisible();
	await expect(whatsapp).toHaveAttribute('aria-disabled', 'true');
	await expect(print).toBeDisabled();

	await page.getByRole('button', { name: 'Cámara' }).click();
	await page.waitForURL(`/orders/${orderId}/files`);
	await page.getByLabel(/pulsa para seleccionar/).setInputFiles(picture);
	await expect(page.getByRole('img', { name: 'obra.webp' })).toBeVisible();

	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${orderId}`);
	await expect(whatsapp).toHaveAttribute('aria-disabled', 'false');
	await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\//);
	await expect(print).toBeEnabled();

	await expectWholeOrderDetails(page);
});
