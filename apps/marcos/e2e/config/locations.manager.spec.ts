import { test, expect } from '../support/test';
import { orderToFinishAtNewLocation as order } from '../support/claims';
import { runId } from '../support/fixture';

const location = `Zona e2e ${runId}`;

test('a new location is offered when finishing an order', async ({ page, open, orderPage }) => {
	await open('/config/orders/locations');
	await page.getByPlaceholder('Añadir nueva ubicación').fill(location);
	await page.getByRole('button', { name: 'Añadir', exact: true }).click();
	await expect(page.getByText(location, { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Guardar cambios' }).click();
	await page.waitForURL('/config');

	await orderPage.open(order.uuid);
	await orderPage.changeStatus('Pendiente', 'Finalizado', location);
	await expect(orderPage.location(location)).toBeVisible();
});
