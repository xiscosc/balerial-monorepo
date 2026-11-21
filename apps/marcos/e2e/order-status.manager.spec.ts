import { test, expect } from '@playwright/test';
import { fullOrders, locations } from './support/fixture';

const order = fullOrders.findLast(
	(o) => o.status === 'pending' && o.amountPayed === 0 && !o.invoiced
)!;
const [finishedLocation, newLocation] = locations;

test('finish an order with a location, move it, mark it picked up, pay part of it and invoice it', async ({
	page
}) => {
	await page.goto(`/orders/${order.uuid}`);

	await page.getByRole('button', { name: 'Estado: Pendiente' }).click();
	const statusDialog = page.getByRole('dialog', { name: 'Cambiar estado' });
	await statusDialog.getByRole('combobox').selectOption(finishedLocation);
	await statusDialog.getByRole('button', { name: 'Cambiar a Finalizado' }).click();
	await expect(statusDialog).toBeHidden();
	await expect(page.getByRole('button', { name: 'Estado: Finalizado' })).toBeVisible();
	await expect(page.getByRole('button', { name: `Ubicación: ${finishedLocation}` })).toBeVisible();

	await page.getByRole('button', { name: `Ubicación: ${finishedLocation}` }).click();
	const locationDialog = page.getByRole('dialog', { name: 'Cambiar ubicación' });
	await locationDialog.getByRole('combobox').selectOption(newLocation);
	await locationDialog.getByRole('button', { name: 'Guardar ubicación' }).click();
	await expect(locationDialog).toBeHidden();
	await expect(page.getByRole('button', { name: `Ubicación: ${newLocation}` })).toBeVisible();

	await page.getByRole('button', { name: 'Estado: Finalizado' }).click();
	await statusDialog.getByRole('button', { name: 'Cambiar a Recogido' }).click();
	await expect(statusDialog).toBeHidden();
	await expect(page.getByRole('button', { name: 'Estado: Recogido' })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Ubicación:/ })).toBeHidden();

	await page.getByRole('button', { name: 'Pendiente de pago' }).click();
	const paymentDialog = page.getByRole('dialog', { name: 'Gestionar pago' });
	await paymentDialog.getByPlaceholder('Cantidad EUR').fill('1');
	await paymentDialog.getByRole('button', { name: 'Pago a cuenta' }).click();
	await expect(paymentDialog).toBeHidden();
	await expect(page.getByRole('button', { name: 'Parcialmente pagado' })).toBeVisible();
	await expect(page.getByText('1.00 € pagado')).toBeVisible();

	await page.getByRole('button', { name: 'No Facturado' }).click();
	const invoiceDialog = page.getByRole('dialog', { name: 'Gestionar factura pedido' });
	await invoiceDialog.getByRole('button', { name: 'Marcar como facturado' }).click();
	await expect(invoiceDialog).toBeHidden();
	await expect(page.getByRole('button', { name: 'Facturado', exact: true })).toBeVisible();

	await page.reload();
	await expect(page.getByRole('button', { name: 'Estado: Recogido' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Parcialmente pagado' })).toBeVisible();
	await expect(page.getByText('1.00 € pagado')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Facturado', exact: true })).toBeVisible();
});
