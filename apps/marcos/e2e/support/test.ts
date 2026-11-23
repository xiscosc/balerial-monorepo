import { test as base } from '@playwright/test';
import { CustomerForm } from './pages/customer-form';
import { FilesPage } from './pages/files-page';
import { NewOrder } from './pages/new-order';
import { OrderForm } from './pages/order-form';
import { OrderPage } from './pages/order-page';

type Fixtures = {
	open: (path: string) => Promise<void>;
	orderPage: OrderPage;
	orderForm: OrderForm;
	newOrder: NewOrder;
	customerForm: CustomerForm;
	filesPage: FilesPage;
};

export const test = base.extend<Fixtures>({
	open: async ({ page }, provide) => {
		await provide(async (path) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');
		});
	},
	orderPage: async ({ page }, provide) => provide(new OrderPage(page)),
	orderForm: async ({ page }, provide) => provide(new OrderForm(page)),
	newOrder: async ({ page }, provide) => provide(new NewOrder(page)),
	customerForm: async ({ page }, provide) => provide(new CustomerForm(page)),
	filesPage: async ({ page }, provide) => provide(new FilesPage(page))
});

export { expect } from '@playwright/test';
