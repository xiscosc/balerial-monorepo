import { test, expect } from '../support/test';
import { orderToScan as order } from '../support/claims';

test('scanning the internal QR of an order opens it', async ({ page, open, orderPage }) => {
	await open('/');
	await page.getByRole('button', { name: 'Escanear resguardo' }).click();
	await page.waitForURL('/orders/scan');

	await page.waitForURL(`/orders/${order.uuid}`);
	await expect(orderPage.status('Pendiente')).toBeVisible();
});
