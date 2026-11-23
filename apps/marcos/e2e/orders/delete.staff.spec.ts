import { test, expect } from '../support/test';
import { orderStaffCannotDelete as order } from '../support/claims';

test('staff cannot delete an order', async ({ page, orderPage }) => {
	await orderPage.open(order.uuid);
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(page.getByText('Administración', { exact: true })).toBeHidden();
	await expect(orderPage.deleteButton()).toBeHidden();

	const response = await page.request.post(`/orders/${order.uuid}?/deleteOrder`, {
		form: {},
		headers: { origin: new URL(page.url()).origin }
	});
	expect(response.status()).toBe(403);

	await page.reload();
	await expect(orderPage.status('Pendiente')).toBeVisible();
});
