import { test, expect } from '@playwright/test';
import { customerOf, elementNames, orderToCopy as order } from './support/fixture';
import { field, orderElement, wholeOrder } from './support/order-form';

const customer = customerOf(order);
const description = `${order.item.description} (copia)`;
const elementName = (name: string) =>
	new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?\\s*(\\(Flot\\))?\\s*$`);

test('duplicate an order and link the copy to the same customer', async ({ page }) => {
	await page.goto(`/orders/${order.uuid}`);
	await page.getByRole('button', { name: 'Copiar' }).click();
	await page.waitForURL(`/orders/new?originId=${order.uuid}`);

	await expect(field(page, 'Descripción')).toHaveValue(order.item.description);
	await expect(page.getByText('Rellene todos los campos')).toBeHidden();

	await field(page, 'Descripción').fill(description);
	await field(page, 'Fecha de entrega').fill(wholeOrder.deliveryDate);
	await page.getByRole('button', { name: 'Crear pedido' }).click();

	await page.waitForURL(/\/orders\/[^/]+\/link$/);
	const copyId = new URL(page.url()).pathname.split('/')[2];
	expect(copyId).not.toBe(order.uuid);
	const phone = page.getByLabel('Teléfono', { exact: true });
	await phone.click();
	await phone.pressSequentially(customer.phone.slice(3));
	await page.getByRole('button', { name: 'Vincular', exact: true }).click();

	await page.waitForURL(`/orders/${copyId}/files`);
	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${copyId}`);
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(page.getByRole('button', { name: customer.name, exact: true })).toBeVisible();
	await expect(page.getByText(description, { exact: true })).toBeVisible();
	for (const name of elementNames(order)) {
		await expect(orderElement(page, elementName(name))).toBeVisible();
	}
});
