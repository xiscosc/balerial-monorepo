import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { sameDayAllFinished, sameDayWithPending } from '../support/claims';
import { customerOf, type FixtureOrder } from '../support/fixture';
import type { FilesPage } from '../support/pages/files-page';
import type { OrderPage } from '../support/pages/order-page';

const openFinishedMessage = async (
	page: Page,
	orderPage: OrderPage,
	filesPage: FilesPage,
	order: FixtureOrder
) => {
	await orderPage.open(order.uuid);
	await orderPage.openFiles();
	await filesPage.uploadPicture();
	await filesPage.backToOrder();
	await page.getByRole('button', { name: 'Enviar mensaje finalizado' }).click();
	await page.waitForURL(`/orders/${order.uuid}/whatsapp`);
};

const openOrdersOfTheDay = async (page: Page, orders: FixtureOrder[]) => {
	const [order] = orders;
	await page.getByRole('button', { name: 'Ver pedidos del día' }).click();
	await page.waitForURL(`/orders/${order.uuid}/day`);
	await expect(page.getByText(customerOf(order).name).first()).toBeVisible();
	for (const sameDayOrder of orders) {
		await expect(page.getByText(sameDayOrder.item.description, { exact: true })).toBeVisible();
	}
};

const notifyAll = (page: Page) =>
	page.getByRole('link', { name: 'Enviar mensaje todos finalizados' });

test('pending orders the same day block the message for all of them', async ({
	page,
	orderPage,
	filesPage
}) => {
	const finished = sameDayWithPending.find((o) => o.status === 'finished')!;
	const orders = [finished, ...sameDayWithPending.filter((o) => o !== finished)];

	await openFinishedMessage(page, orderPage, filesPage, finished);
	await expect(page.getByText('Hay pedidos pendientes')).toBeVisible();

	await openOrdersOfTheDay(page, orders);
	await expect(notifyAll(page)).toHaveAttribute('aria-disabled', 'true');
});

test('when every order of the day is finished the customer is notified for all of them', async ({
	page,
	orderPage,
	filesPage
}) => {
	const [order] = sameDayAllFinished;

	await openFinishedMessage(page, orderPage, filesPage, order);
	await expect(page.getByText('Todos los pedidos del día están finalizados')).toBeVisible();

	await openOrdersOfTheDay(page, sameDayAllFinished);
	await page.getByRole('button', { name: 'Enviar mensaje todos finalizados' }).click();
	const whatsapp = page.getByRole('dialog', { name: 'WhatsApp' });
	await expect(notifyAll(page)).toHaveAttribute('href', /^https:\/\/wa\.me\//);
	await page.keyboard.press('Escape');
	await expect(whatsapp).toBeHidden();
	await expect(page.getByText('Cliente avisado')).toBeVisible();

	for (const sameDayOrder of sameDayAllFinished) {
		await orderPage.open(sameDayOrder.uuid);
		await expect(page.getByText('Cliente avisado')).toBeVisible();
	}
});
