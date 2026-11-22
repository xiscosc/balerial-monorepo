import { expect, type Page } from '@playwright/test';
import { pricing } from '../fixture';
import { isoDateInDays } from '../dates';
import type { OrderDetails } from './order-page';

const molds = ['629_M0001', '622_M0002', '704.30_M0009'].map((id) => pricing.get(id)!);

export const wholeOrder = {
	description: 'Obra e2e',
	observations: 'Marco con cuidado',
	predefinedObservations: ['Muy delicado'],
	deliveryDate: isoDateInDays(7),
	sizes: ['30x40 cm', '40x50 cm', '50x60 cm'],
	elements: [
		['PP 004 (7)', '0.00 €'],
		['M0001 - UBI: 629', '29.69 €'],
		['M0002 - UBI: 622', '39.87 €'],
		['M0009 - UBI: 704.30 (Flot)', '64.87 €'],
		['GLASS 032', '10.80 €'],
		['BACK 005', '6.30 €'],
		['LABOUR 045', '2.00 €'],
		['HANGER 002', '3.20 €'],
		['OTHER 014', '9.03 €'],
		['TRANSPORT 034*', '50.00 €'],
		['Barniz', '25.00 €'],
		['Cantoneras', '2.50 €']
	],
	discount: '15 %',
	totals: ['243.27 €', '214.28 €']
} satisfies OrderDetails;

export class OrderForm {
	constructor(private readonly page: Page) {}

	field(label: string) {
		return this.page.getByLabel(label, { exact: true });
	}

	missing(reason: string) {
		return this.page.getByRole('listitem').filter({ hasText: reason });
	}

	incomplete() {
		return this.page.getByText('Rellene todos los campos');
	}

	async fillNumber(label: string, value: string) {
		await this.field(label).fill(value);
		await this.field(label).blur();
	}

	async addFromSection(section: string, priceId: string, quantity?: string) {
		const group = this.page.getByRole('group', { name: section, exact: true });
		await group.getByRole('combobox').first().selectOption(priceId);
		if (quantity) {
			await group.getByRole('combobox', { name: 'Cantidad', exact: true }).selectOption(quantity);
		}
		await group.getByRole('button', { name: 'Añadir a la lista', exact: true }).click();
	}

	async addMold(mold: { id: string; description: string }) {
		await this.page.getByLabel('Moldura/Marco:').fill(mold.id.split('_')[1]);
		await this.page.getByRole('button', { name: new RegExp(`^${mold.description} \\(`) }).click();
	}

	async deleteElement(name: string) {
		await this.page
			.getByRole('button', { name: `Eliminar ${name}` })
			.first()
			.click();
	}

	async addAndExpect(add: () => Promise<void>, reason: string) {
		await add();
		await expect(this.missing(reason)).toBeHidden();
	}

	async fillWholeOrder() {
		await expect(this.incomplete()).toBeVisible();

		await this.fillNumber('Alto (cm)', '30');
		await this.fillNumber('Ancho (cm)', '40');

		await this.page.getByRole('radio', { name: 'Ext.' }).check();
		await expect(this.missing('Faltan medidas exteriores')).toBeVisible();
		await this.fillNumber('Alto Exterior (cm)', '50');
		await this.fillNumber('Ancho Exterior (cm)', '60');
		await expect(this.missing('Faltan medidas exteriores')).toBeHidden();

		await this.field('Número').fill('7');
		await this.fillNumber('Medidas PP o Fondo (cm)', '5');
		await this.addAndExpect(() => this.addFromSection('PP / Fondo', 'PP_004'), 'Falta PP');
		await expect(this.page.getByText('Alto: 40cm | Ancho: 50cm')).toBeVisible();

		for (const mold of molds) {
			await this.addMold(mold);
		}
		await expect(this.missing('Falta moldura / marco')).toBeHidden();
		await expect(this.missing('Falta distancia flotante')).toBeVisible();
		await this.fillNumber('Distancia flotante (cm)', '2');
		await expect(this.missing('Falta distancia flotante')).toBeHidden();

		await this.addAndExpect(() => this.addFromSection('Cristal', 'GLASS_032'), 'Falta cristal');
		await this.addAndExpect(() => this.addFromSection('Trasera', 'BACK_005'), 'Falta trasera');
		await this.addAndExpect(() => this.addFromSection('Montajes', 'LABOUR_045'), 'Faltan montajes');
		await this.addAndExpect(
			() => this.addFromSection('Colgadores', 'HANGER_002', '2'),
			'Falta colgadores'
		);
		await this.addAndExpect(
			() => this.addFromSection('Suministros', 'OTHER_014'),
			'Faltan suministros'
		);
		await this.addAndExpect(
			() => this.addFromSection('Transporte', 'TRANSPORT_034'),
			'Falta transporte'
		);

		await this.field('Nombre del elemento').fill('Barniz');
		await this.field('Precio del elemento').fill('12.5');
		await this.field('Cantidad del elemento').selectOption('2');
		await this.page.getByRole('button', { name: 'Añadir a la lista (elemento extra)' }).click();
		await expect(this.page.getByText('Barniz').first()).toBeVisible();

		await this.field('Descripción').fill(wholeOrder.description);
		await expect(this.missing('Falta descripción')).toBeHidden();
		await this.field('Observaciones').fill(wholeOrder.observations);
		await this.page.getByRole('button', { name: wholeOrder.predefinedObservations[0] }).click();
		await expect(this.missing('Faltan observaciones')).toBeHidden();

		await this.field('Fecha de entrega').fill(wholeOrder.deliveryDate);
		await this.field('Descuento').selectOption('15');
		await expect(this.page.getByText('* Elementos con descuento no permitido')).toBeVisible();

		await expect(this.incomplete()).toBeHidden();
	}
}
