import { test, expect } from '../support/test';
import { unknownOrderId } from '../support/claims';

test('scanning the QR of an order that no longer exists says it was not found', async ({
	page,
	open
}) => {
	await open('/');
	await page.getByRole('button', { name: 'Escanear resguardo' }).click();
	await page.waitForURL('/orders/scan');

	await page.waitForURL(`/orders/${unknownOrderId}`);
	await expect(page.getByText('Cliente o pedido no encontrado')).toBeVisible();
});
