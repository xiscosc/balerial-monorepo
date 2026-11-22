import { test, expect } from '../support/test';
import { newestPendingOrder } from '../support/claims';

test('non-admins only see orders after searching', async ({ page, open }) => {
	const details = page.getByRole('button', { name: 'Ver', exact: true });
	const description = newestPendingOrder.item.description;

	await open('/orders/list');
	await expect(details).toHaveCount(0);

	await page
		.getByRole('textbox', { name: 'Buscar en descripción...' })
		.pressSequentially(description.split(' ').at(-1)!);

	await expect(page.getByText(description, { exact: true })).toBeVisible();
	await expect(details).toHaveCount(1);
});
