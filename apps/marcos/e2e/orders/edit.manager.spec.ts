import { test, expect } from '../support/test';
import { orderToEdit as order } from '../support/claims';
import { pricing } from '../support/fixture';

const description = `${order.item.description} editado`;
const observations = 'Cambiar el cristal';
const glass = order.item.partsToCalculate
	.map((p) => pricing.get(p.id)!)
	.find((p) => p.type === 'glass')!;
const newGlass = pricing.get(glass.id === 'GLASS_032' ? 'GLASS_036' : 'GLASS_032')!;

test('edit an order, swap its glass, change the discount and make it immediate delivery', async ({
	page,
	orderPage,
	orderForm
}) => {
	await orderPage.open(order.uuid);
	await orderPage.edit();
	await expect(orderForm.field('Descripción')).toHaveValue(order.item.description);
	await expect(orderForm.incomplete()).toBeHidden();

	await orderForm.field('Descripción').fill(description);
	await orderForm.field('Observaciones').fill(observations);

	await orderForm.deleteElement(glass.description);
	await expect(orderForm.missing('Falta cristal')).toBeVisible();
	await orderForm.addAndExpect(
		() => orderForm.addFromSection('Cristal', newGlass.id),
		'Falta cristal'
	);

	await orderForm.field('Descuento').selectOption('10');
	await expect(orderForm.field('Fecha de entrega')).toBeVisible();
	await page.getByRole('switch', { name: 'Al momento' }).click();
	await expect(orderForm.field('Fecha de entrega')).toBeHidden();

	await expect(orderForm.incomplete()).toBeHidden();
	await page.getByRole('button', { name: 'Editar pedido' }).click();

	await page.waitForURL(`/orders/${order.uuid}`);
	await orderPage.expectDetails({
		description,
		observations,
		elements: [[newGlass.description]],
		discount: '10 %'
	});
	await expect(page.getByText('Al momento', { exact: true })).toBeVisible();
	await expect(page.getByText(glass.description, { exact: true })).toBeHidden();
});
