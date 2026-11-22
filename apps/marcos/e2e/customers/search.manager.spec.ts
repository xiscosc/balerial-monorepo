import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { fixture } from '../support/fixture';

const query = 'CLÍENTE 042';
const matches = fixture.CUSTOMER_TABLE.filter((c) => c.normalizedName.includes('cliente 042'));
const results = (page: Page) => page.getByRole('button', { name: /^Cliente \d{4}$/ });

test('search customers by name ignoring case and accents and open one', async ({ page, open }) => {
	await open('/customers/search');
	const name = page.getByLabel('Nombre', { exact: true });
	const search = page.getByRole('button', { name: 'Buscar por nombre' });

	await name.fill('Cl');
	await expect(search).toBeDisabled();
	await name.fill(query);
	await search.click();

	await page.waitForURL('/customers/search-list');
	await expect(page.getByText(`Búsqueda de clientes - ${query}`)).toBeVisible();
	await expect(results(page)).toHaveCount(matches.length);
	expect((await results(page).allInnerTexts()).toSorted()).toEqual(
		matches.map((c) => c.name).toSorted()
	);

	const [customer] = matches;
	await page.getByRole('button', { name: customer.name, exact: true }).click();
	await page.waitForURL(`/customers/${customer.uuid}`);
	await expect(page.getByText(customer.name, { exact: true })).toBeVisible();
});

test('searching a name nobody has shows no results', async ({ page, open }) => {
	await open('/customers/search');
	await page.getByLabel('Nombre', { exact: true }).fill('Nadie con este nombre');
	await page.getByRole('button', { name: 'Buscar por nombre' }).click();

	await page.waitForURL('/customers/search-list');
	await expect(page.getByText('No se han encontrado clientes')).toBeVisible();
	await expect(results(page)).toHaveCount(0);
});
