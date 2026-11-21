import { test, expect, type Page } from '@playwright/test';
import { fixture, runId, uniquePhone } from './support/fixture';

const price = (id: string) => fixture.LIST_PRICING_TABLE.find((p) => p.id === id)!;
const molds = ['629_M0001', '622_M0002', '704.30_M0009'].map(price);

const orderElements = [
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
];

const customerName = `Cliente e2e ${runId}`;
const description = 'Obra e2e';
const picture = {
	name: 'obra.png',
	mimeType: 'image/png',
	buffer: Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
		'base64'
	)
};

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const missing = (page: Page, reason: string) =>
	page.getByRole('listitem').filter({ hasText: reason });

const fillNumber = async (page: Page, label: string, value: string) => {
	await field(page, label).fill(value);
	await field(page, label).blur();
};

const addFromSection = async (page: Page, section: string, priceId: string, quantity?: string) => {
	const group = page.getByRole('group', { name: section, exact: true });
	await group.getByRole('combobox').first().selectOption(priceId);
	if (quantity) {
		await group.getByRole('combobox', { name: 'Cantidad', exact: true }).selectOption(quantity);
	}
	await group.getByRole('button', { name: 'Añadir a la lista', exact: true }).click();
};

const addMold = async (page: Page, mold: { id: string; description: string }) => {
	await page.getByLabel('Moldura/Marco:').fill(mold.id.split('_')[1]);
	await page.getByRole('button', { name: new RegExp(`^${mold.description} \\(`) }).click();
};

test('create an order with the whole form, link it to a new customer and upload a picture', async ({
	page
}) => {
	await page.goto('/orders/new');
	await expect(page.getByText('Rellene todos los campos')).toBeVisible();

	await fillNumber(page, 'Alto (cm)', '30');
	await fillNumber(page, 'Ancho (cm)', '40');

	await page.getByRole('radio', { name: 'Ext.' }).check();
	await expect(missing(page, 'Faltan medidas exteriores')).toBeVisible();
	await fillNumber(page, 'Alto Exterior (cm)', '50');
	await fillNumber(page, 'Ancho Exterior (cm)', '60');
	await expect(missing(page, 'Faltan medidas exteriores')).toBeHidden();

	await field(page, 'Número').fill('7');
	await fillNumber(page, 'Medidas PP o Fondo (cm)', '5');
	await addFromSection(page, 'PP / Fondo', 'PP_004');
	await expect(missing(page, 'Falta PP')).toBeHidden();
	await expect(page.getByText('Alto: 40cm | Ancho: 50cm')).toBeVisible();

	for (const mold of molds) {
		await addMold(page, mold);
	}
	await expect(missing(page, 'Falta moldura / marco')).toBeHidden();
	await expect(missing(page, 'Falta distancia flotante')).toBeVisible();
	await fillNumber(page, 'Distancia flotante (cm)', '2');
	await expect(missing(page, 'Falta distancia flotante')).toBeHidden();

	await addFromSection(page, 'Cristal', 'GLASS_032');
	await expect(missing(page, 'Falta cristal')).toBeHidden();
	await addFromSection(page, 'Trasera', 'BACK_005');
	await expect(missing(page, 'Falta trasera')).toBeHidden();
	await addFromSection(page, 'Montajes', 'LABOUR_045');
	await expect(missing(page, 'Faltan montajes')).toBeHidden();
	await addFromSection(page, 'Colgadores', 'HANGER_002', '2');
	await expect(missing(page, 'Falta colgadores')).toBeHidden();
	await addFromSection(page, 'Suministros', 'OTHER_014');
	await expect(missing(page, 'Faltan suministros')).toBeHidden();
	await addFromSection(page, 'Transporte', 'TRANSPORT_034');
	await expect(missing(page, 'Falta transporte')).toBeHidden();

	await field(page, 'Nombre del elemento').fill('Barniz');
	await field(page, 'Precio del elemento').fill('12.5');
	await field(page, 'Cantidad del elemento').selectOption('2');
	await page.getByRole('button', { name: 'Añadir a la lista (elemento extra)' }).click();
	await expect(page.getByText('Barniz').first()).toBeVisible();

	await field(page, 'Descripción').fill(description);
	await expect(missing(page, 'Falta descripción')).toBeHidden();
	await field(page, 'Observaciones').fill('Marco con cuidado');
	await page.getByRole('button', { name: 'Muy delicado' }).click();
	await expect(missing(page, 'Faltan observaciones')).toBeHidden();

	const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	await field(page, 'Fecha de entrega').fill(deliveryDate);
	await field(page, 'Descuento').selectOption('15');
	await expect(page.getByText('* Elementos con descuento no permitido')).toBeVisible();

	await expect(page.getByText('Rellene todos los campos')).toBeHidden();
	await page.getByRole('button', { name: 'Crear pedido' }).click();

	await page.waitForURL(/\/orders\/[^/]+\/link$/);
	const orderId = new URL(page.url()).pathname.split('/')[2];
	await page.getByLabel('Nombre', { exact: true }).fill(customerName);
	const phone = page.getByLabel('Teléfono', { exact: true });
	await expect(phone).toHaveValue('+34');
	await phone.click();
	await phone.pressSequentially(uniquePhone());
	await page.getByRole('button', { name: 'Vincular', exact: true }).click();

	const whatsapp = page.getByRole('link', { name: 'Enviar resguardo' });
	const print = page.locator('button', { hasText: 'Imprimir' });

	await page.waitForURL(`/orders/${orderId}/files`);
	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${orderId}`);
	await expect(page.getByRole('button', { name: 'Estado: Pendiente' })).toBeVisible();
	await expect(page.getByRole('button', { name: customerName })).toBeVisible();
	await expect(whatsapp).toHaveAttribute('aria-disabled', 'true');
	await expect(print).toBeDisabled();

	await page.getByRole('button', { name: 'Cámara' }).click();
	await page.waitForURL(`/orders/${orderId}/files`);
	await page.getByLabel(/pulsa para seleccionar/).setInputFiles(picture);
	await expect(page.getByRole('img', { name: 'obra.webp' })).toBeVisible();

	await page.getByRole('button', { name: 'Volver al pedido' }).click();
	await page.waitForURL(`/orders/${orderId}`);
	await expect(whatsapp).toHaveAttribute('aria-disabled', 'false');
	await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\//);
	await expect(print).toBeEnabled();

	await expect(page.getByText(description, { exact: true })).toBeVisible();
	await expect(page.getByText('Marco con cuidado', { exact: true })).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'Muy delicado' })).toBeVisible();
	await expect(page.getByText(deliveryDate.split('-').reverse().join('/'))).toBeVisible();
	await expect(page.getByText('30x40 cm', { exact: true })).toBeVisible();
	await expect(page.getByText('40x50 cm', { exact: true })).toBeVisible();
	await expect(page.getByText('50x60 cm', { exact: true })).toBeVisible();

	for (const [name, amount] of orderElements) {
		await expect(
			page
				.locator('div')
				.filter({ has: page.getByText(name, { exact: true }) })
				.filter({ hasText: amount })
				.last()
		).toBeVisible();
	}
	await expect(page.getByText('15 %', { exact: true })).toBeVisible();
	await expect(page.getByText('243.27 €', { exact: true })).toBeVisible();
	await expect(page.getByText('214.28 €', { exact: true }).last()).toBeVisible();
});
