import type { Locator } from '@playwright/test';
import jsQR from 'jsqr';

export const readQr = async (img: Locator) => {
	const { width, height, pixels } = await img.evaluate(async (el: HTMLImageElement) => {
		await el.decode();
		const quietZone = 40;
		const canvas = document.createElement('canvas');
		canvas.width = el.naturalWidth + quietZone * 2;
		canvas.height = el.naturalHeight + quietZone * 2;
		const context = canvas.getContext('2d')!;
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(el, quietZone, quietZone);
		const image = context.getImageData(0, 0, canvas.width, canvas.height);
		return { width: image.width, height: image.height, pixels: Array.from(image.data) };
	});
	return jsQR(Uint8ClampedArray.from(pixels), width, height)?.data;
};
