import { expect, type Page } from '@playwright/test';
import { displayDate } from '../dates';

export type OrderDetails = {
	description?: string;
	observations?: string;
	predefinedObservations?: string[];
	deliveryDate?: string;
	sizes?: string[];
	elements?: [name: string | RegExp, amount?: string][];
	discount?: string;
	totals?: string[];
};

export class OrderPage {
	constructor(private readonly page: Page) {}

	async open(orderId: string) {
		await this.page.goto(`/orders/${orderId}`);
	}

	kind(kind: 'Pedido' | 'Presupuesto') {
		return this.page.getByText(kind, { exact: true });
	}

	status(name: string) {
		return this.page.getByRole('button', { name: `Estado: ${name}` });
	}

	anyStatus() {
		return this.page.getByRole('button', { name: /^Estado:/ });
	}

	location(name: string) {
		return this.page.getByRole('button', { name: `Ubicación: ${name}` });
	}

	anyLocation() {
		return this.page.getByRole('button', { name: /^Ubicación:/ });
	}

	customer(name: string) {
		return this.page.getByRole('button', { name, exact: true });
	}

	receiptWhatsApp() {
		return this.page.getByRole('link', { name: 'Enviar resguardo' });
	}

	printButton() {
		return this.page.locator('button', { hasText: 'Imprimir' });
	}

	element(name: string | RegExp, amount = '€') {
		return this.page
			.locator('div')
			.filter({ has: this.page.getByText(name, { exact: true }) })
			.filter({ hasText: amount })
			.last();
	}

	async changeStatus(from: string, to: string, location?: string) {
		await this.status(from).click();
		const dialog = this.page.getByRole('dialog', { name: 'Cambiar estado' });
		if (location) {
			await dialog.getByRole('combobox').selectOption(location);
		}
		await dialog.getByRole('button', { name: `Cambiar a ${to}` }).click();
		await expect(dialog).toBeHidden();
		await expect(this.status(to)).toBeVisible();
	}

	async changeLocation(from: string, to: string) {
		await this.location(from).click();
		const dialog = this.page.getByRole('dialog', { name: 'Cambiar ubicación' });
		await dialog.getByRole('combobox').selectOption(to);
		await dialog.getByRole('button', { name: 'Guardar ubicación' }).click();
		await expect(dialog).toBeHidden();
		await expect(this.location(to)).toBeVisible();
	}

	async payOnAccount(amount: string) {
		await this.page.getByRole('button', { name: 'Pendiente de pago' }).click();
		const dialog = this.page.getByRole('dialog', { name: 'Gestionar pago' });
		await dialog.getByPlaceholder('Cantidad EUR').fill(amount);
		await dialog.getByRole('button', { name: 'Pago a cuenta' }).click();
		await expect(dialog).toBeHidden();
	}

	async markInvoiced() {
		await this.page.getByRole('button', { name: 'No Facturado' }).click();
		const dialog = this.page.getByRole('dialog', { name: 'Gestionar factura pedido' });
		await dialog.getByRole('button', { name: 'Marcar como facturado' }).click();
		await expect(dialog).toBeHidden();
	}

	async convertToOrder(deliveryDate: string) {
		await this.page.getByRole('button', { name: 'Convertir en pedido' }).click();
		const dialog = this.page.getByRole('dialog', { name: 'Convertir en pedido' });
		await dialog.getByLabel('Fecha de entrega:').fill(deliveryDate);
		await dialog.getByRole('button', { name: 'Convertir en pedido' }).click();
		await expect(dialog).toBeHidden();
	}

	async convertToQuote() {
		await this.page.getByRole('button', { name: 'Convertir en presupuesto' }).click();
		const dialog = this.page.getByRole('dialog', { name: 'Convertir en presupuesto' });
		await dialog.getByRole('button', { name: 'Convertir en presupuesto' }).click();
		await expect(dialog).toBeHidden();
	}

	deleteButton() {
		return this.page.getByRole('button', { name: 'Eliminar pedido' });
	}

	async delete() {
		await this.deleteButton().click();
		await this.page
			.getByRole('dialog', { name: 'Eliminar pedido' })
			.getByRole('button', { name: 'Confirmar' })
			.click();
		await this.page.waitForURL('/');
	}

	async edit() {
		await this.page.getByRole('button', { name: 'Editar' }).click();
		await this.page.waitForURL(/\/orders\/[^/]+\/edit$/);
	}

	async duplicate() {
		await this.page.getByRole('button', { name: 'Copiar' }).click();
		await this.page.waitForURL(/\/orders\/new\?originId=/);
	}

	async openFiles() {
		await this.page.getByRole('button', { name: 'Cámara' }).click();
		await this.page.waitForURL(/\/orders\/[^/]+\/files$/);
	}

	async expectDetails(details: OrderDetails) {
		const text = (value: string) => this.page.getByText(value, { exact: true });
		if (details.description) await expect(text(details.description)).toBeVisible();
		if (details.observations) await expect(text(details.observations)).toBeVisible();
		for (const value of details.predefinedObservations ?? []) {
			await expect(this.page.getByRole('listitem').filter({ hasText: value })).toBeVisible();
		}
		if (details.deliveryDate) {
			await expect(this.page.getByText(displayDate(details.deliveryDate))).toBeVisible();
		}
		for (const size of details.sizes ?? []) await expect(text(size)).toBeVisible();
		for (const [name, amount] of details.elements ?? []) {
			await expect(this.element(name, amount)).toBeVisible();
		}
		if (details.discount) await expect(text(details.discount)).toBeVisible();
		for (const total of details.totals ?? []) await expect(text(total).last()).toBeVisible();
	}
}
