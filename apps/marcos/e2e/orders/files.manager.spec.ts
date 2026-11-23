import { test, expect } from '../support/test';
import { orderToDeletePhotoFrom, orderWithoutArtwork } from '../support/claims';

test('an order without artwork gets a "Sin obra" file and can lose it again', async ({
	page,
	orderPage,
	filesPage
}) => {
	const addNoArtwork = page.getByRole('button', { name: 'Añadir archivo Sin Obra' });
	const deleteNoArtwork = page.getByRole('button', { name: 'Eliminar Sin Obra' });

	await orderPage.open(orderWithoutArtwork.uuid);
	await expect(orderPage.printButton()).toBeDisabled();

	await orderPage.openFiles();
	await addNoArtwork.click();
	await expect(deleteNoArtwork).toBeVisible();
	await expect(addNoArtwork).toBeHidden();

	await filesPage.backToOrder();
	await expect(orderPage.printButton()).toBeEnabled();

	await orderPage.openFiles();
	await deleteNoArtwork.click();
	await page
		.getByRole('dialog', { name: 'Eliminar elemento' })
		.getByRole('button', { name: 'Confirmar' })
		.click();
	await expect(addNoArtwork).toBeVisible();
	await expect(deleteNoArtwork).toBeHidden();
});

test('delete an uploaded photo', async ({ page, orderPage, filesPage }) => {
	const photos = page.getByRole('img', { name: 'obra.webp' });

	await orderPage.open(orderToDeletePhotoFrom.uuid);
	await orderPage.openFiles();
	await filesPage.uploadPicture();

	await page.getByRole('button', { name: 'obra.webp' }).click();
	await page.getByRole('button', { name: 'Eliminar imagen' }).click();
	await page
		.getByRole('dialog', { name: 'Eliminar imagen' })
		.getByRole('button', { name: 'Confirmar' })
		.click();

	await expect(photos).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Añadir archivo Sin Obra' })).toBeVisible();
});
