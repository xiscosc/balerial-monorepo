import { test, expect } from '../support/test';
import { customerWithOrders } from '../support/claims';
import { fixture, runId, uniquePhone } from '../support/fixture';
import { nationalNumber } from '../support/pages/customer-form';

const newCustomerUrl = /\/customers\/(?!new$)[^/]+$/;

test('create a customer, edit it and delete it', async ({ page, open, customerForm }) => {
	const name = `Cliente nuevo ${runId}`;
	const phone = uniquePhone();

	await open('/customers/search');
	await page.getByRole('button', { name: 'Crear cliente' }).click();
	await page.waitForURL('/customers/new');
	await customerForm.fill(name, phone);
	await page.getByRole('button', { name: 'Crear', exact: true }).click();

	await page.waitForURL(newCustomerUrl);
	const customerUrl = new URL(page.url()).pathname;
	await expect(page.getByText(name, { exact: true })).toBeVisible();
	await expect(page.getByText(`+34${phone}`, { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Editar cliente' }).click();
	await page.waitForURL(`${customerUrl}/edit`);
	await expect(customerForm.name()).toHaveValue(name);
	await expect(customerForm.phone()).toHaveValue(`+34${phone}`);

	await customerForm.phone().fill(customerWithOrders.phone);
	await page.getByRole('button', { name: 'Editar', exact: true }).click();
	await expect(page.getByText('Número de teléfono ya en uso')).toBeVisible();

	const newName = `${name} editado`;
	const newPhone = uniquePhone();
	await customerForm.fill(newName, newPhone);
	await page.getByRole('button', { name: 'Editar', exact: true }).click();
	await page.waitForURL(customerUrl);
	await expect(page.getByText(newName, { exact: true })).toBeVisible();
	await expect(page.getByText(`+34${newPhone}`, { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Eliminar cliente' }).click();
	await page
		.getByRole('dialog', { name: 'Eliminar cliente' })
		.getByRole('button', { name: 'Confirmar' })
		.click();
	await page.waitForURL('/');

	await page.goto(customerUrl);
	await expect(page.getByText('Cliente no encontrado')).toBeVisible();
});

test('creating a customer with an existing phone opens that customer', async ({
	page,
	customerForm,
	open
}) => {
	await open('/customers/new');
	await customerForm.fill('Cliente repetido', nationalNumber(customerWithOrders.phone));
	await page.getByRole('button', { name: 'Crear', exact: true }).click();

	await page.waitForURL(`/customers/${customerWithOrders.uuid}`);
	await expect(page.getByText(customerWithOrders.name, { exact: true })).toBeVisible();
});

test('a customer with orders cannot be deleted', async ({ page }) => {
	await page.goto(`/customers/${customerWithOrders.uuid}`);
	await page.getByRole('button', { name: 'Eliminar cliente' }).click();

	const dialog = page.getByRole('dialog', { name: 'Eliminar cliente' });
	await expect(
		dialog.getByText('El cliente tiene pedidos o presupuestos, no se puede eliminar.')
	).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Confirmar' })).toBeHidden();
});

test('the customer list shows every customer of the store', async ({ page, open }) => {
	const customers = page.getByRole('button', { name: /^Cliente \d{4}$/ });
	const loadMore = page.getByRole('button', { name: 'Cargar más' });

	await open('/customers/search');
	await page.getByRole('button', { name: 'Ver listado' }).click();
	await page.waitForURL('/customers/list');

	await expect(customers.first()).toBeVisible();
	while (await loadMore.isVisible()) {
		const loaded = await customers.count();
		await loadMore.click();
		await expect.poll(() => customers.count()).toBeGreaterThan(loaded);
	}
	await expect(customers).toHaveCount(fixture.CUSTOMER_TABLE.length);

	await page.getByRole('button', { name: customerWithOrders.name, exact: true }).click();
	await page.waitForURL(`/customers/${customerWithOrders.uuid}`);
});
