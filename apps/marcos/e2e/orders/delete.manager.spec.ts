import { test, expect } from '../support/test';
import { orderToDelete as order } from '../support/claims';

test('a price manager deletes an order', async ({ page, orderPage }) => {
	await orderPage.open(order.uuid);
	await expect(orderPage.status('Pendiente')).toBeVisible();

	await orderPage.delete();

	await orderPage.open(order.uuid);
	await expect(page.getByText('Cliente o pedido no encontrado')).toBeVisible();
});
