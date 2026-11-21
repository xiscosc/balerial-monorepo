import { test, expect } from '@playwright/test';
import { orderToQuote, quoteToOrder } from './support/fixture';
import { wholeOrder } from './support/order-form';

test('convert a quote into an order with a delivery date', async ({ page }) => {
	await page.goto(`/orders/${quoteToOrder.uuid}`);
	await expect(page.getByText('Presupuesto', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Estado:/ })).toBeHidden();

	await page.getByRole('button', { name: 'Convertir en pedido' }).click();
	const dialog = page.getByRole('dialog', { name: 'Convertir en pedido' });
	await dialog.getByLabel('Fecha de entrega:').fill(wholeOrder.deliveryDate);
	await dialog.getByRole('button', { name: 'Convertir en pedido' }).click();
	await expect(dialog).toBeHidden();

	await page.reload();
	await expect(page.getByText('Pedido', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(
		page.getByText(wholeOrder.deliveryDate.split('-').reverse().join('/'))
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Convertir en presupuesto' })).toBeVisible();
});

test('convert a paid order into a quote and drop its payment and delivery date', async ({
	page
}) => {
	const payment = page.getByRole('button', { name: /^(Pagado|Parcialmente pagado)$/ });

	await page.goto(`/orders/${orderToQuote.uuid}`);
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(payment).toBeVisible();
	await expect(page.getByText('Fecha de recogida')).toBeVisible();

	await page.getByRole('button', { name: 'Convertir en presupuesto' }).click();
	const dialog = page.getByRole('dialog', { name: 'Convertir en presupuesto' });
	await dialog.getByRole('button', { name: 'Convertir en presupuesto' }).click();
	await expect(dialog).toBeHidden();

	await page.reload();
	await expect(page.getByText('Presupuesto', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Estado:/ })).toBeHidden();
	await expect(payment).toBeHidden();
	await expect(page.getByText('Fecha de recogida')).toBeHidden();
	await expect(page.getByRole('button', { name: 'Convertir en pedido' })).toBeVisible();
});
