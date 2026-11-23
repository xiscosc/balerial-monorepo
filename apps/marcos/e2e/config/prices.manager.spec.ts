import { test, expect } from '../support/test';
import { runId } from '../support/fixture';

const id = `E2E_GLASS_${runId.toUpperCase()}`;
const description = `Cristal e2e ${runId}`;
const editedDescription = `${description} editado`;
const priceListUrl = '/config/prices/list?type=glass';
const priceEditUrl = /\/config\/prices\/(?!list$|new$)[^/]+$/;

test('create a glass price, edit it, use it in the order form and delete it', async ({
	page,
	open,
	orderForm,
	orderPage
}) => {
	const row = page.getByRole('row').filter({ hasText: id });

	await open('/config');
	await page.getByRole('button', { name: 'Nuevo precio' }).click();
	await page.waitForURL('/config/prices/new');
	await page.getByLabel('ID:').fill(id);
	await page.getByLabel('Descripción:').fill(description);
	await page.getByRole('combobox', { name: 'Tipo' }).selectOption('glass');
	await page.getByRole('combobox', { name: 'Cómo calcular' }).selectOption('none');
	await page.getByLabel('Precio:', { exact: true }).fill('12.5');
	await page.getByRole('button', { name: 'Guardar' }).click();

	await page.waitForURL(priceListUrl);
	await expect(row).toContainText(description);
	await expect(row).toContainText('12.50 €');

	await row.getByRole('button', { name: `Editar ${id}` }).click();
	await page.waitForURL(priceEditUrl);
	await expect(page.getByLabel('ID:')).toHaveValue(id);
	await page.getByLabel('Descripción:').fill(editedDescription);
	await page.getByLabel('Precio:', { exact: true }).fill('20');
	await page.getByRole('button', { name: 'Guardar' }).click();

	await page.waitForURL(priceListUrl);
	await expect(row).toContainText(editedDescription);
	await expect(row).toContainText('20.00 €');

	await page.goto('/orders/new');
	await orderForm.addAndExpect(() => orderForm.addFromSection('Cristal', id), 'Falta cristal');
	await expect(orderPage.element(editedDescription, '20.00 €')).toBeVisible();

	await open(priceListUrl);
	await row.getByRole('button', { name: `Editar ${id}` }).click();
	await page.waitForURL(priceEditUrl);
	await page.getByRole('button', { name: 'Eliminar precio' }).click();
	await page
		.getByRole('dialog', { name: 'Eliminar precio' })
		.getByRole('button', { name: 'Confirmar' })
		.click();

	await page.waitForURL(priceListUrl);
	await expect(page.getByRole('row').first()).toBeVisible();
	await expect(row).toHaveCount(0);
});
