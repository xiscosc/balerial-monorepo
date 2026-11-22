import { test, expect } from '../support/test';

test('scanning a QR that is not a receipt says its format is wrong', async ({ page, open }) => {
	await open('/');
	await page.getByRole('button', { name: 'Escanear resguardo' }).click();
	await page.waitForURL('/orders/scan');

	await expect(page.getByText('El formato del resguardo es incorrecto')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Volver a intentar' })).toBeVisible();
	await expect(page).toHaveURL('/orders/scan');
});
