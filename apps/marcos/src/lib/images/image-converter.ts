import { Tracking } from '@/shared/tracking';
import { ClientFeature } from '@/shared/tracking/client.features';
import { UAParser } from 'ua-parser-js';
import { BrowserName } from 'ua-parser-js/enums';

type OutputFormat = {
	mime: 'image/webp' | 'image/jpeg';
	ext: string;
	magickFormat: 'WebP' | 'Jpeg';
};

const WEBP_FORMAT: OutputFormat = { mime: 'image/webp', ext: 'webp', magickFormat: 'WebP' };
const JPEG_FORMAT: OutputFormat = { mime: 'image/jpeg', ext: 'jpg', magickFormat: 'Jpeg' };

export class ImageConverter {
	private static readonly MAX_IMAGE_WIDTH = 2160;
	private static readonly QUALITY = 0.8;
	private static readonly HEIC_TYPES = ['image/heic', 'image/heif'];
	private static readonly HEIC_EXTENSIONS = ['.heic', '.heif'];

	static isImageFile(file: File): boolean {
		return file.type.startsWith('image/') || ImageConverter.isHeic(file);
	}

	static isHeic(file: File): boolean {
		if (ImageConverter.HEIC_TYPES.includes(file.type)) return true;
		const name = file.name.toLowerCase();
		return ImageConverter.HEIC_EXTENSIONS.some((ext) => name.endsWith(ext));
	}

	private static get isSafari(): boolean {
		const parser = new UAParser();
		const browser = parser.getBrowser();
		return browser.is(BrowserName.SAFARI) || browser.is(BrowserName.SAFARI_MOBILE);
	}

	private static async convertWithWasm(file: File, format: OutputFormat): Promise<File> {
		const { initializeImageMagick, ImageMagick, MagickFormat, MagickGeometry } = await import(
			'@imagemagick/magick-wasm'
		);
		const wasmModule = await import('@imagemagick/magick-wasm/magick.wasm?url');
		const wasmResponse = await fetch(wasmModule.default);
		const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());
		await initializeImageMagick(wasmBytes);

		const imageBytes = new Uint8Array(await file.arrayBuffer());

		const convertedBlob = await new Promise<Blob>((resolve, reject) => {
			try {
				ImageMagick.read(imageBytes, (image) => {
					if (image.width > ImageConverter.MAX_IMAGE_WIDTH) {
						const scale = ImageConverter.MAX_IMAGE_WIDTH / image.width;
						const geometry = new MagickGeometry(
							ImageConverter.MAX_IMAGE_WIDTH,
							Math.round(image.height * scale)
						);
						image.resize(geometry);
					}
					image.quality = Math.round(ImageConverter.QUALITY * 100);
					image.write(MagickFormat[format.magickFormat], (data) => {
						resolve(new Blob([new Uint8Array(data)], { type: format.mime }));
					});
				});
			} catch (e) {
				reject(e);
			}
		});

		return new File([convertedBlob], ImageConverter.changeExtension(file.name, format.ext), {
			type: format.mime
		});
	}

	private static async convertWithCanvas(file: File, format: OutputFormat): Promise<File> {
		const bitmap = await createImageBitmap(file);

		const scale =
			bitmap.width > ImageConverter.MAX_IMAGE_WIDTH
				? ImageConverter.MAX_IMAGE_WIDTH / bitmap.width
				: 1;
		const width = Math.round(bitmap.width * scale);
		const height = Math.round(bitmap.height * scale);

		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(bitmap, 0, 0, width, height);
		bitmap.close();

		const blob = await canvas.convertToBlob({
			type: format.mime,
			quality: ImageConverter.QUALITY
		});

		return new File([blob], ImageConverter.changeExtension(file.name, format.ext), {
			type: format.mime
		});
	}

	private static safariOptimize = false;

	static init() {
		Tracking.runWhenFeatureIsEnabled(ClientFeature.OPTIMIZE_IMAGES, () => {
			ImageConverter.safariOptimize = true;
		});
	}

	/**
	 * Not Safari: canvas → webp, HEIC → wasm → webp
	 * Safari + FF enabled: all images → wasm → webp
	 * Safari + FF disabled: canvas → jpeg, HEIC → wasm → jpeg
	 */
	static async convertImage(file: File): Promise<File> {
		let convertedFile: File;

		if (!ImageConverter.isSafari) {
			convertedFile = ImageConverter.isHeic(file)
				? await ImageConverter.convertWithWasm(file, WEBP_FORMAT)
				: await ImageConverter.convertWithCanvas(file, WEBP_FORMAT);
		} else if (ImageConverter.safariOptimize) {
			convertedFile = await ImageConverter.convertWithWasm(file, WEBP_FORMAT);
		} else {
			convertedFile = ImageConverter.isHeic(file)
				? await ImageConverter.convertWithWasm(file, WEBP_FORMAT)
				: await ImageConverter.convertWithCanvas(file, JPEG_FORMAT);
		}

		Tracking.event('Image converted', {
			format: convertedFile.type,
			safari: ImageConverter.isSafari,
			safariOptimize: ImageConverter.safariOptimize,
			originalSize: file.size,
			convertedSize: convertedFile.size,
			compressionRate: ((1 - convertedFile.size / file.size) * 100).toFixed(2)
		});

		return convertedFile;
	}

	private static changeExtension(filename: string, ext: string): string {
		const lastDotIndex = filename.lastIndexOf('.');
		const baseName = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
		return `${baseName}.${ext}`;
	}
}
