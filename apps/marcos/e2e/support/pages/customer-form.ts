import type { Locator, Page } from '@playwright/test';

export const nationalNumber = (phone: string) => phone.slice(3);

export const typePhone = async (field: Locator, number: string) => {
	await field.fill('+34');
	await field.click();
	await field.pressSequentially(number);
};

export class CustomerForm {
	constructor(private readonly page: Page) {}

	name() {
		return this.page.getByLabel('Nombre', { exact: true });
	}

	phone() {
		return this.page.getByLabel('Teléfono', { exact: true });
	}

	async fill(name: string, number: string) {
		await this.name().fill(name);
		await typePhone(this.phone(), number);
	}
}
