import { trackEvent } from '@/shared/fronted-analytics/posthog';

export class ImageConverter {
	private static readonly MAX_IMAGE_WIDTH = 2160;
	private static readonly QUALITY = 0.8;

	static isImageFile(file: File): boolean {
		return file.type.startsWith('image/');
	}

	private static get supportsWebP(): boolean {
		const canvas = document.createElement('canvas');
		return canvas.toDataURL('image/webp').startsWith('data:image/webp');
	}

	private static get outputFormat(): { mime: 'image/webp' | 'image/jpeg'; ext: string } {
		return ImageConverter.supportsWebP
			? { mime: 'image/webp', ext: 'webp' }
			: { mime: 'image/jpeg', ext: 'jpg' };
	}

	static async convertImage(file: File): Promise<File> {
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

		trackEvent('Image converted', {
			format: ext,
			originalSize: file.size,
			convertedSize: convertedFile.size,
			compressionRate: ((1 - convertedFile.size / file.size) * 100).toFixed(2)
		});
		return convertedFile;
	}

	/** @deprecated Use convertImage instead */
	static convertToWebP(file: File): Promise<File> {
		return ImageConverter.convertImage(file);
	}

	private static changeExtension(filename: string, ext: string): string {
		const lastDotIndex = filename.lastIndexOf('.');
		const baseName = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
		return `${baseName}.${ext}`;
	}
}
