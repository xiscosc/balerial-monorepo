import { Tracking } from '@/shared/tracking';
import { UAParser } from 'ua-parser-js';
import { BrowserName } from 'ua-parser-js/enums';

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

	private static get outputFormat(): {
		mime: 'image/webp' | 'image/jpeg';
		ext: string;
		magickFormat: 'WebP' | 'Jpeg';
	} {
		return ImageConverter.isSafari
			? { mime: 'image/jpeg', ext: 'jpg', magickFormat: 'Jpeg' }
			: { mime: 'image/webp', ext: 'webp', magickFormat: 'WebP' };
	}

	private static async convertHeic(file: File): Promise<File> {
		const { initializeImageMagick, ImageMagick, MagickFormat, MagickGeometry } = await import(
			'@imagemagick/magick-wasm'
		);
		const wasmModule = await import('@imagemagick/magick-wasm/magick.wasm?url');
		const wasmResponse = await fetch(wasmModule.default);
		const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());
		await initializeImageMagick(wasmBytes);

		const { mime, ext, magickFormat } = ImageConverter.outputFormat;
		const heicBytes = new Uint8Array(await file.arrayBuffer());

		const convertedBlob = await new Promise<Blob>((resolve, reject) => {
			try {
				ImageMagick.read(heicBytes, (image) => {
					if (image.width > ImageConverter.MAX_IMAGE_WIDTH) {
						const scale = ImageConverter.MAX_IMAGE_WIDTH / image.width;
						const geometry = new MagickGeometry(
							ImageConverter.MAX_IMAGE_WIDTH,
							Math.round(image.height * scale)
						);
						image.resize(geometry);
					}
					image.quality = Math.round(ImageConverter.QUALITY * 100);
					image.write(MagickFormat[magickFormat], (data) => {
						resolve(new Blob([new Uint8Array(data)], { type: mime }));
					});
				});
			} catch (e) {
				reject(e);
			}
		});

		return new File([convertedBlob], ImageConverter.changeExtension(file.name, ext), {
			type: mime
		});
	}

	static async convertImage(file: File): Promise<File> {
		if (ImageConverter.isHeic(file)) {
			const convertedFile = await ImageConverter.convertHeic(file);
			Tracking.event('Image converted', {
				format: ImageConverter.outputFormat.ext,
				originalSize: file.size,
				convertedSize: convertedFile.size,
				compressionRate: ((1 - convertedFile.size / file.size) * 100).toFixed(2)
			});
			return convertedFile;
		}

		const { mime, ext } = ImageConverter.outputFormat;
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
			type: mime,
			quality: ImageConverter.QUALITY
		});
		const convertedFile = new File([blob], ImageConverter.changeExtension(file.name, ext), {
			type: mime
		});

		Tracking.event('Image converted', {
			format: ext,
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
