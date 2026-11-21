import { test, expect } from '@playwright/test';
import { newestPendingOrder } from './support/fixture';

test('non-admins only see orders after searching', async ({ page }) => {
	await page.goto('/orders/list');
	await page.waitForLoadState('networkidle');

	await expect(page.getByRole('button', { name: 'Ver', exact: true })).toHaveCount(0);

	const description = newestPendingOrder.item.description;
	await page
		.getByRole('textbox', { name: 'Buscar en descripción...' })
		.pressSequentially(description.split(' ').at(-1)!);

	await expect(page.getByText(description, { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ver', exact: true })).toHaveCount(1);
});
