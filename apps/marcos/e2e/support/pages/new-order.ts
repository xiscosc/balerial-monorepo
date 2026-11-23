import type { Page } from '@playwright/test';
import { typePhone } from './customer-form';

export class NewOrder {
	constructor(private readonly page: Page) {}

	async create() {
		await this.page.getByRole('button', { name: 'Crear pedido' }).click();
		await this.page.waitForURL(/\/orders\/[^/]+\/(link|files)$/);
		return new URL(this.page.url()).pathname.split('/')[2];
	}

	async linkToNewCustomer(name: string, number: string) {
		await this.page.getByLabel('Nombre', { exact: true }).fill(name);
		await this.linkToCustomer(number);
	}

	async linkToCustomer(number: string) {
		await typePhone(this.page.getByLabel('Teléfono', { exact: true }), number);
		await this.page.getByRole('button', { name: 'Vincular', exact: true }).click();
		await this.page.waitForURL(/\/orders\/[^/]+\/files$/);
	}
}
