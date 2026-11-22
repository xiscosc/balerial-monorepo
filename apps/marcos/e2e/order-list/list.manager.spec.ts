import { test, expect } from '../support/test';
import { newestPendingOrder } from '../support/claims';

test('admins see the pending orders list without searching', async ({ page }) => {
	await page.goto('/orders/list');

	await expect(page.getByText(newestPendingOrder.item.description, { exact: true })).toBeVisible();
});
