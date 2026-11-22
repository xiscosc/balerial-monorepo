import { test, expect } from '../support/test';
import { runId, uniquePhone } from '../support/fixture';

test('staff cannot see the customer list', async ({ page, open }) => {
	await open('/customers/search');
	await expect(page.getByRole('button', { name: 'Buscar por nombre' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ver listado' })).toBeHidden();

	const response = await page.goto('/customers/list');
	expect(response?.status()).toBe(403);
});

test('staff can create a customer but cannot delete it', async ({ page, customerForm }) => {
	const name = `Cliente staff ${runId}`;

	await page.goto('/customers/new');
	await customerForm.fill(name, uniquePhone());
	await page.getByRole('button', { name: 'Crear', exact: true }).click();

	await page.waitForURL(/\/customers\/(?!new$)[^/]+$/);
	const customerUrl = new URL(page.url()).pathname;
	await expect(page.getByText(name, { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Eliminar cliente' })).toBeHidden();

	const response = await page.request.post(`${customerUrl}?/deleteCustomer`, {
		form: {},
		headers: { origin: new URL(page.url()).origin }
	});
	expect(response.status()).toBe(403);

	await page.reload();
	await expect(page.getByText(name, { exact: true })).toBeVisible();
});
