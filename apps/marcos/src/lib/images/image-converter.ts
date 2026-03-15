import { trackEvent } from '@/shared/fronted-analytics/posthog';

export class ImageConverter {
	private static readonly MAX_IMAGE_WIDTH = 2160;
	private static readonly WEBP_QUALITY = 0.8;

	static isImageFile(file: File): boolean {
		return file.type.startsWith('image/');
	}

	static async convertToWebP(file: File): Promise<File> {
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
			type: 'image/webp',
			quality: ImageConverter.WEBP_QUALITY
		});
		const convertedFile = new File([blob], ImageConverter.changeExtensionToWebp(file.name), {
			type: 'image/webp'
		});

		trackEvent('Image converted to WebP', {
			originalSize: file.size,
			convertedSize: convertedFile.size,
			compressionRate: (1 - convertedFile.size / file.size) * 100
		});
		return convertedFile;
	}

	private static changeExtensionToWebp(filename: string): string {
		const lastDotIndex = filename.lastIndexOf('.');
		const baseName = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
		return `${baseName}.webp`;
	}
}
