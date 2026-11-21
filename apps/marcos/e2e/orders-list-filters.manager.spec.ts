import { test, expect, type Page } from '@playwright/test';
import { fixture, ordersNewestFirst } from './support/fixture';

const descriptionWords = [
	...new Set(fixture.ORDER_TABLE.map((o) => o.item.description.split(' ')[0]))
];
const descriptions = (page: Page) =>
	page.getByText(new RegExp(`^(${descriptionWords.join('|')}) \\d{4}$`));
const firstDescription = (page: Page) => descriptions(page).first();

const isUnlinked = (o: { customerUuid: string }) => o.customerUuid === 'temp-customer';
const searchTerm = 'Lienzo';
const matchesSearch = (o: { item: { description: string } }) =>
	o.item.description.startsWith(searchTerm);

const sortSelect = (page: Page) => page.getByRole('combobox', { name: 'Ordenar pedidos' });
const filterButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('status, unlinked and sort filters on the orders list', async ({ page }) => {
	const pending = ordersNewestFirst('pending');
	const finished = ordersNewestFirst('finished');
	const pickedUp = ordersNewestFirst('picked_up');
	const unlinkedPending = ordersNewestFirst('pending', isUnlinked);

	await page.goto('/orders/list');
	await expect(firstDescription(page)).toHaveText(pending[0].item.description);
	await expect(page.getByText(finished[0].item.description, { exact: true })).toBeHidden();

	await sortSelect(page).selectOption('oldest');
	await expect(firstDescription(page)).toHaveText(pending.at(-1)!.item.description);
	await sortSelect(page).selectOption('newest');
	await expect(firstDescription(page)).toHaveText(pending[0].item.description);

	await filterButton(page, 'Sin vincular').click();
	await expect(filterButton(page, 'Vincular')).toHaveCount(unlinkedPending.length);
	await expect(filterButton(page, 'Ver')).toHaveCount(0);
	await expect(firstDescription(page)).toHaveText(unlinkedPending[0].item.description);

	await filterButton(page, 'Finalizados').click();
	await expect(firstDescription(page)).toHaveText(finished[0].item.description);
	await expect(page.getByText(pending[0].item.description, { exact: true })).toBeHidden();

	await filterButton(page, 'Recogidos').click();
	await expect(firstDescription(page)).toHaveText(pickedUp[0].item.description);
	await expect(page.getByText(finished[0].item.description, { exact: true })).toBeHidden();
});

test('status, unlinked and sort filters on the search results', async ({ page }) => {
	const pending = ordersNewestFirst('pending', matchesSearch);
	const finished = ordersNewestFirst('finished', matchesSearch);
	const unlinkedPending = ordersNewestFirst('pending', (o) => matchesSearch(o) && isUnlinked(o));
	const otherDescriptions = descriptions(page).filter({ hasNotText: searchTerm });

	await page.goto('/orders/list');
	await expect(firstDescription(page)).toHaveText(ordersNewestFirst('pending')[0].item.description);
	await page
		.getByRole('textbox', { name: 'Buscar en descripción...' })
		.pressSequentially(searchTerm);

	await expect(firstDescription(page)).toHaveText(pending[0].item.description);
	await expect(otherDescriptions).toHaveCount(0);
	await expect(page.getByText(finished[0].item.description, { exact: true })).toBeHidden();

	await sortSelect(page).selectOption('oldest');
	await expect(firstDescription(page)).toHaveText(pending.at(-1)!.item.description);
	await sortSelect(page).selectOption('newest');
	await expect(firstDescription(page)).toHaveText(pending[0].item.description);

	await filterButton(page, 'Sin vincular').click();
	await expect(filterButton(page, 'Vincular')).toHaveCount(unlinkedPending.length);
	await expect(filterButton(page, 'Ver')).toHaveCount(0);
	await expect(firstDescription(page)).toHaveText(unlinkedPending[0].item.description);

	await filterButton(page, 'Finalizados').click();
	await expect(firstDescription(page)).toHaveText(finished[0].item.description);
	await expect(otherDescriptions).toHaveCount(0);
	await expect(page.getByText(pending[0].item.description, { exact: true })).toBeHidden();

	await sortSelect(page).selectOption('oldest');
	await expect(firstDescription(page)).toHaveText(finished.at(-1)!.item.description);
});
