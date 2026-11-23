import { test, expect } from '../support/test';
import { customerWithOrdersAndQuotes as customer } from '../support/claims';
import { ordersOfCustomer } from '../support/fixture';

const orders = ordersOfCustomer(customer.uuid).filter((o) => o.status !== 'quote');
const quotes = ordersOfCustomer(customer.uuid).filter((o) => o.status === 'quote');

test("a customer's page lists their orders and, separately, their quotes", async ({ page }) => {
	const description = (text: string) => page.getByText(text, { exact: true });

	await page.goto(`/customers/${customer.uuid}`);
	await page.getByRole('button', { name: 'Ver pedidos' }).click();
	await page.waitForURL(`/customers/${customer.uuid}/orders`);
	await expect(page.getByText(`Pedidos de ${customer.name}`)).toBeVisible();
	for (const order of orders) await expect(description(order.item.description)).toBeVisible();
	for (const quote of quotes) await expect(description(quote.item.description)).toBeHidden();

	await page.goto(`/customers/${customer.uuid}`);
	await page.getByRole('button', { name: 'Ver presupuestos' }).click();
	await page.waitForURL(`/customers/${customer.uuid}/orders?quotes=true`);
	await expect(page.getByText(`Presupuestos de ${customer.name}`)).toBeVisible();
	for (const quote of quotes) await expect(description(quote.item.description)).toBeVisible();
	for (const order of orders) await expect(description(order.item.description)).toBeHidden();
});
