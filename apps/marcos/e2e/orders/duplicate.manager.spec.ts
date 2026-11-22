import { test, expect } from '../support/test';
import { orderToDuplicate as order } from '../support/claims';
import { isoDateInDays } from '../support/dates';
import { customerOf, elementNames } from '../support/fixture';
import { nationalNumber } from '../support/pages/customer-form';

const customer = customerOf(order);
const description = `${order.item.description} (copia)`;
const elementName = (name: string) =>
	new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?\\s*(\\(Flot\\))?\\s*$`);

test('duplicate an order and link the copy to the same customer', async ({
	page,
	orderPage,
	orderForm,
	newOrder,
	filesPage
}) => {
	await orderPage.open(order.uuid);
	await orderPage.duplicate();
	await expect(orderForm.field('Descripción')).toHaveValue(order.item.description);
	await expect(orderForm.incomplete()).toBeHidden();

	await orderForm.field('Descripción').fill(description);
	await orderForm.field('Fecha de entrega').fill(isoDateInDays(7));
	const copyId = await newOrder.create();
	expect(copyId).not.toBe(order.uuid);

	await newOrder.linkToCustomer(nationalNumber(customer.phone));
	await filesPage.backToOrder();
	await expect(page).toHaveURL(`/orders/${copyId}`);
	await expect(orderPage.status('Pendiente')).toBeVisible();
	await expect(orderPage.customer(customer.name)).toBeVisible();
	await orderPage.expectDetails({
		description,
		elements: elementNames(order).map((name) => [elementName(name)])
	});
});
