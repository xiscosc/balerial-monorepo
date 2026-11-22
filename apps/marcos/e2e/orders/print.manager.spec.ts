import { test, expect } from '../support/test';
import { orderToPrint as order } from '../support/claims';
import { readQr } from '../support/qr';

test('an order with files opens its printable receipt with the shop QR', async ({
	page,
	orderPage
}) => {
	await orderPage.open(order.uuid);
	await expect(orderPage.printButton()).toBeEnabled();
	await orderPage.printButton().click();

	await page.waitForURL(`/orders/${order.uuid}/print`);
	await expect(page.getByText(order.publicId, { exact: true }).first()).toBeVisible();
	await expect(page.getByText(order.item.description, { exact: true }).first()).toBeVisible();
	expect(await readQr(page.getByRole('img', { name: 'qr' }))).toBe(
		`urn:order:${order.uuid}:internal`
	);
});
