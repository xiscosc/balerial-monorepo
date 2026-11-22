import { test, expect } from '../support/test';
import { tracking } from '../support/claims';
import { displayDate } from '../support/dates';
import { runId } from '../support/fixture';
import { readQr } from '../support/qr';

test('the tracking page shows the order with its dates and customer QR', async ({ page }) => {
	const { order } = tracking;
	const deliveryDate = new Date(order.item.deliveryDate as number).toISOString().slice(0, 10);

	await page.goto(`/track/${order.shortId}`);

	await expect(page).toHaveURL(`/track/${order.shortId}`);
	await expect(page.getByText(order.publicId, { exact: true })).toBeVisible();
	await expect(page.getByText('Fecha de entrada')).toBeVisible();
	await expect(page.getByText(displayDate(deliveryDate))).toBeVisible();
	await expect(page.getByText(order.item.description, { exact: true })).toBeVisible();
	expect(await readQr(page.getByRole('img', { name: 'qr' }))).toBe(
		`urn:order:${order.uuid}:customer-v2`
	);
});

test('a quote tracking link opens the receipt instead', async ({ page }) => {
	await page.goto(`/track/${tracking.quote.shortId}`);

	await expect(page).toHaveURL(`/s/${tracking.quote.shortId}`);
	await expect(page.getByText('PRESUPUESTO', { exact: true })).toBeVisible();
});

test('an unknown tracking link redirects to the shop website', async ({ request }) => {
	const response = await request.get(`/track/missing-${runId}`, { maxRedirects: 0 });

	expect(response.status()).toBe(303);
	expect(response.headers().location).toBe('https://marcsimoldures.com/');
});
