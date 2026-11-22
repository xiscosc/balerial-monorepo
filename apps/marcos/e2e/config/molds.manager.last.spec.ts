import { fileURLToPath } from 'node:url';
import { test, expect } from '../support/test';
import { fixture } from '../support/fixture';

const moldsFile = fileURLToPath(new URL('../fixtures/molds.xlsx', import.meta.url));
const seededMold = fixture.LIST_PRICING_TABLE.find((p) => p.type === 'mold')!;
const moldsInFile = [
	['M9001 UBI: E2E1', '12.35 €'],
	['M9002 UBI: E2E2 (Flotante)', '7.50 €'],
	['M9003 UBI: E2E3', '20.00 €']
];

test('uploading a mold file replaces every mold price with the ones in the file', async ({
	page,
	open
}) => {
	const moldRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
	const moldSearch = page.getByLabel('Moldura/Marco:');

	await page.goto('/config/prices/list');
	await expect(moldRows.filter({ hasText: seededMold.description })).toHaveCount(1);

	await open('/config');
	await page.getByRole('button', { name: 'Cargar molduras' }).click();
	await page.waitForURL('/config/prices/molds');
	await page.getByLabel(/pulsa para seleccionar/).setInputFiles(moldsFile);
	await page.getByRole('button', { name: 'Cargar archivo excel' }).click();
	await expect(page.getByText('Precios actualizados correctamente')).toBeVisible({
		timeout: 30_000
	});

	await page.goto('/config/prices/list');
	await expect(moldRows).toHaveCount(moldsInFile.length);
	for (const [description, price] of moldsInFile) {
		await expect(moldRows.filter({ hasText: description })).toContainText(price);
	}

	await page.goto('/orders/new');
	await moldSearch.fill('M9002');
	await expect(page.getByRole('button', { name: /^M9002 UBI: E2E2 \(/ })).toBeVisible();
	await moldSearch.fill(seededMold.description);
	await expect(page.getByText('No se encontraron resultados')).toBeVisible();
});
