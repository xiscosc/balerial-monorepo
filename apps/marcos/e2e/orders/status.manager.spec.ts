import { test, expect } from '../support/test';
import { orderToFinish as order } from '../support/claims';
import { locations } from '../support/fixture';

const [finishedLocation, newLocation] = locations;

test('finish an order with a location, notify the customer, move it, mark it picked up, pay part of it and invoice it', async ({
	page,
	orderPage
}) => {
	const partlyPaid = page.getByRole('button', { name: 'Parcialmente pagado' });
	const invoiced = page.getByRole('button', { name: 'Facturado', exact: true });

	await orderPage.open(order.uuid);
	await orderPage.changeStatus('Pendiente', 'Finalizado', finishedLocation);
	await expect(orderPage.location(finishedLocation)).toBeVisible();

	await page.getByRole('button', { name: 'Enviar mensaje finalizado' }).click();
	const whatsapp = page.getByRole('dialog', { name: 'WhatsApp' });
	await expect(whatsapp.getByRole('link', { name: 'Enviar mensaje finalizado' })).toHaveAttribute(
		'href',
		/^https:\/\/wa\.me\//
	);
	await page.keyboard.press('Escape');
	await expect(whatsapp).toBeHidden();
	await expect(page.getByText('Cliente avisado')).toBeVisible();

	await orderPage.changeLocation(finishedLocation, newLocation);
	await orderPage.changeStatus('Finalizado', 'Recogido');
	await expect(orderPage.anyLocation()).toBeHidden();

	await orderPage.payOnAccount('1');
	await expect(partlyPaid).toBeVisible();
	await expect(page.getByText('1.00 € pagado')).toBeVisible();

	await orderPage.markInvoiced();
	await expect(invoiced).toBeVisible();

	await page.reload();
	await expect(orderPage.status('Recogido')).toBeVisible();
	await expect(page.getByText('Avisos al cliente')).toBeVisible();
	await expect(partlyPaid).toBeVisible();
	await expect(page.getByText('1.00 € pagado')).toBeVisible();
	await expect(invoiced).toBeVisible();
});
