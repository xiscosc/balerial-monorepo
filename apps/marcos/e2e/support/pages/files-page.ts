import { expect, type Page } from '@playwright/test';

const picture = {
	name: 'obra.png',
	mimeType: 'image/png',
	buffer: Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
		'base64'
	)
};

export class FilesPage {
	constructor(private readonly page: Page) {}

	async uploadPicture() {
		await this.page.getByLabel(/pulsa para seleccionar/).setInputFiles(picture);
		await expect(this.page.getByRole('img', { name: 'obra.webp' })).toBeVisible();
	}

	async backToOrder() {
		await this.page.getByRole('button', { name: 'Volver al pedido' }).click();
		await this.page.waitForURL(/\/orders\/[^/]+$/);
	}
}
