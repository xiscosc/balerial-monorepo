import { test, expect } from '../support/test';
import { tracking } from '../support/claims';

test('logged-in users opening a tracking link get the receipt', async ({ page }) => {
	await page.goto(`/track/${tracking.order.shortId}`);

	await expect(page).toHaveURL(`/s/${tracking.order.shortId}`);
	await expect(page.getByText(tracking.order.publicId, { exact: true })).toBeVisible();
});
