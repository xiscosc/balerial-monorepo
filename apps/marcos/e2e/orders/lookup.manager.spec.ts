import { test, expect } from '../support/test';
import { orderToLookUp as order } from '../support/claims';
import { runId } from '../support/fixture';

test('look up an order by its identifier', async ({ page, orderPage }) => {
	await page.goto('/orders/search');
	await page.getByLabel('Identificador:').fill(order.publicId);
	await page.getByRole('button', { name: 'Buscar' }).click();

	await page.waitForURL(`/orders/${order.uuid}`);
	await expect(orderPage.status('Finalizado')).toBeVisible();
});

test('looking up an unknown identifier says it was not found', async ({ page }) => {
	await page.goto('/orders/search');
	await page.getByLabel('Identificador:').fill(`00000000/XX/${runId}`);
	await page.getByRole('button', { name: 'Buscar' }).click();

	await expect(page.getByText('No se ha encontrado el pedido')).toBeVisible();
	await expect(page).toHaveURL('/orders/search');
});
