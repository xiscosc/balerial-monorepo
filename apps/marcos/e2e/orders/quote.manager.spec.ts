import { test, expect } from '../support/test';
import { paidOrderToQuote, quoteToOrder } from '../support/claims';
import { isoDateInDays } from '../support/dates';

test('convert a quote into an order with a delivery date', async ({ page, orderPage }) => {
	const deliveryDate = isoDateInDays(7);

	await orderPage.open(quoteToOrder.uuid);
	await expect(orderPage.kind('Presupuesto')).toBeVisible();
	await expect(orderPage.anyStatus()).toBeHidden();

	await orderPage.convertToOrder(deliveryDate);

	await page.reload();
	await expect(orderPage.kind('Pedido')).toBeVisible();
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await orderPage.expectDetails({ deliveryDate });
	await expect(page.getByRole('button', { name: 'Convertir en presupuesto' })).toBeVisible();
});

test('convert a paid order into a quote and drop its payment and delivery date', async ({
	page,
	orderPage
}) => {
	const payment = page.getByRole('button', { name: /^(Pagado|Parcialmente pagado)$/ });
	const deliveryDate = page.getByText('Fecha de recogida');

	await orderPage.open(paidOrderToQuote.uuid);
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(payment).toBeVisible();
	await expect(deliveryDate).toBeVisible();

	await orderPage.convertToQuote();

	await page.reload();
	await expect(orderPage.kind('Presupuesto')).toBeVisible();
	await expect(orderPage.anyStatus()).toBeHidden();
	await expect(payment).toBeHidden();
	await expect(deliveryDate).toBeHidden();
	await expect(page.getByRole('button', { name: 'Convertir en pedido' })).toBeVisible();
});
