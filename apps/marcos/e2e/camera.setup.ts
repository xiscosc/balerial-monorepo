import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import QRCode from 'qrcode';
import { test as setup } from '@playwright/test';
import { orderToScan, unknownOrderId } from './support/claims';
import { cameraScenarios, cameraVideoFile, type CameraScenario } from './support/env';

const width = 640;
const height = 480;
const moduleSize = 6;
const black = 16;
const white = 235;

const qrText: Record<CameraScenario, string> = {
	'existing-order': `urn:order:${orderToScan.uuid}:internal`,
	'unknown-order': `urn:order:${unknownOrderId}:internal`,
	'not-a-receipt': 'https://example.com/producto/8412345678905'
};

const videoOfQr = (text: string) => {
	const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
	const qrSize = modules.size * moduleSize;
	const left = Math.floor((width - qrSize) / 2);
	const top = Math.floor((height - qrSize) / 2);

	const luma = Buffer.alloc(width * height, white);
	for (let y = 0; y < qrSize; y++) {
		for (let x = 0; x < qrSize; x++) {
			if (modules.get(Math.floor(y / moduleSize), Math.floor(x / moduleSize))) {
				luma[(top + y) * width + left + x] = black;
			}
		}
	}
	const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 128);
	const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma]);
	return Buffer.concat([
		Buffer.from(`YUV4MPEG2 W${width} H${height} F10:1 Ip A1:1 C420jpeg\n`),
		frame,
		frame
	]);
};

for (const scenario of cameraScenarios) {
	setup(`camera video for ${scenario}`, () => {
		mkdirSync(dirname(cameraVideoFile(scenario)), { recursive: true });
		writeFileSync(cameraVideoFile(scenario), videoOfQr(qrText[scenario]));
	});
}
