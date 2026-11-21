import { test, expect } from '@playwright/test';
import { orderToEdit as order, pricing } from './support/fixture';
import { addFromSection, field, missing, orderElement } from './support/order-form';

const description = `${order.item.description} editado`;
const glass = order.item.partsToCalculate
	.map((p) => pricing.get(p.id)!)
	.find((p) => p.type === 'glass')!;
const newGlass = pricing.get(glass.id === 'GLASS_032' ? 'GLASS_036' : 'GLASS_032')!;

test('edit an order, swap its glass, change the discount and make it immediate delivery', async ({
	page
}) => {
	await page.goto(`/orders/${order.uuid}`);
	await page.getByRole('button', { name: 'Editar' }).click();
	await page.waitForURL(`/orders/${order.uuid}/edit`);

	await expect(field(page, 'Descripción')).toHaveValue(order.item.description);
	await expect(page.getByText('Rellene todos los campos')).toBeHidden();

	await field(page, 'Descripción').fill(description);
	await field(page, 'Observaciones').fill('Cambiar el cristal');

	await page
		.getByRole('button', { name: `Eliminar ${glass.description}` })
		.first()
		.click();
	await expect(missing(page, 'Falta cristal')).toBeVisible();
	await addFromSection(page, 'Cristal', newGlass.id);
	await expect(missing(page, 'Falta cristal')).toBeHidden();

	await field(page, 'Descuento').selectOption('10');
	await expect(field(page, 'Fecha de entrega')).toBeVisible();
	await page.getByRole('switch', { name: 'Al momento' }).click();
	await expect(field(page, 'Fecha de entrega')).toBeHidden();

	await expect(page.getByText('Rellene todos los campos')).toBeHidden();
	await page.getByRole('button', { name: 'Editar pedido' }).click();

	await page.waitForURL(`/orders/${order.uuid}`);
	await expect(page.getByText(description, { exact: true })).toBeVisible();
	await expect(page.getByText('Cambiar el cristal', { exact: true })).toBeVisible();
	await expect(page.getByText('Al momento', { exact: true })).toBeVisible();
	await expect(orderElement(page, newGlass.description)).toBeVisible();
	await expect(page.getByText(glass.description, { exact: true })).toBeHidden();
	await expect(page.getByText('10 %', { exact: true })).toBeVisible();
});
