import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { listSearchTerm as searchTerm } from '../support/claims';
import { fixture, ordersNewestFirst } from '../support/fixture';

const listedDescriptions = fixture.ORDER_TABLE.filter((o) => o.status !== 'quote').map(
	(o) => o.item.description
);
const descriptions = (page: Page) =>
	page.getByText(new RegExp(`^(${listedDescriptions.join('|')})$`));
const firstDescription = (page: Page) => descriptions(page).first();

const isUnlinked = (o: { customerUuid: string }) => o.customerUuid === 'temp-customer';
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
	await expect(filterButton(page, 'Ver')).toHaveCount(0);
	await expect(descriptions(page)).toHaveText(unlinkedPending.map((o) => o.item.description));

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
