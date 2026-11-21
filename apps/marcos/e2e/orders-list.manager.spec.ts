import { test, expect } from '@playwright/test';
import { newestPendingOrder } from './support/fixture';

test('admins see the pending orders list without searching', async ({ page }) => {
	await page.goto('/orders/list');

	await expect(page.getByText(newestPendingOrder.item.description, { exact: true })).toBeVisible();
});
