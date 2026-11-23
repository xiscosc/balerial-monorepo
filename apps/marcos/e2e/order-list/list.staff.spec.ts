import { test, expect } from '../support/test';
import { newestPendingOrder } from '../support/claims';

test('non-admins only see orders after searching', async ({ page, open }) => {
	const details = page.getByRole('button', { name: 'Ver', exact: true });
	const minChars = page.getByText('Escribe más de 3 carácteres');
	const search = page.getByRole('textbox', { name: 'Buscar en descripción...' });
	const description = newestPendingOrder.item.description;

	await open('/orders/list');
	await expect(minChars).toBeVisible();
	await expect(details).toHaveCount(0);

	await search.pressSequentially(description.split(' ').at(-1)!);

	await expect(page.getByText(description, { exact: true })).toBeVisible();
	await expect(details).toHaveCount(1);

	await search.press('ControlOrMeta+a');
	await search.press('Backspace');

	await expect(minChars).toBeVisible();
	await expect(details).toHaveCount(0);
});
