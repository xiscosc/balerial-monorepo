import { test, expect } from '@playwright/test';
import { fullOrders, runId } from './support/fixture';
import { readQr } from './support/qr';

const receiptOrder = (match: (order: (typeof fullOrders)[number]) => boolean) => {
	const order = fullOrders.find(match);
	if (order == null) throw new Error('No fixture order matches');
	return order;
};

test('order link shows the receipt with its payment status and customer QR', async ({ page }) => {
	const order = receiptOrder((o) => o.status === 'pending' && o.amountPayed === 0);

	await page.goto(`/s/${order.shortId}`);

	await expect(page).toHaveURL(`/s/${order.shortId}`);
	await expect(page.getByText(order.publicId, { exact: true })).toBeVisible();
	await expect(page.getByText('PENDIENTE DE PAGO', { exact: true })).toBeVisible();
	expect(await readQr(page.getByRole('img', { name: 'qr' }))).toBe(
		`urn:order:${order.uuid}:customer`
	);
});

test('quote link shows the receipt as a quote with its customer QR', async ({ page }) => {
	const quote = receiptOrder((o) => o.status === 'quote');

	await page.goto(`/s/${quote.shortId}`);

	await expect(page.getByText(quote.publicId, { exact: true })).toBeVisible();
	await expect(page.getByText('PRESUPUESTO', { exact: true })).toBeVisible();
	expect(await readQr(page.getByRole('img', { name: 'qr' }))).toBe(
		`urn:order:${quote.uuid}:customer`
	);
});

test('unknown link redirects to the shop website', async ({ request }) => {
	const response = await request.get(`/s/missing-${runId}`, { maxRedirects: 0 });

	expect(response.status()).toBe(303);
	expect(response.headers().location).toBe('https://marcsimoldures.com/');
});
