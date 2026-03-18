import type { RequestHandler } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { FileType, ImageVariant } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	const { id } = params;
	const { fileService, orderService } = locals.services!;
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	const { filename, fileType, imageVariant } = (await request.json()) as {
		filename: string;
		fileType?: FileType;
		imageVariant?: ImageVariant.ORIGINAL | ImageVariant.OPTIMIZED;
	};
	if (filename == null) {
		return json({ error: 'Filename is required' }, { status: 400 });
	}

	const file =
		fileType === FileType.NO_ART
			? await fileService.createNoArtFile(id)
			: await fileService.createFile(id, filename, imageVariant);
	await ServerTracking.event('order_file_created', {
		user: locals.user!,
		context: locals.trackingContext,
		orderId: id,
		properties: {
			fileId: file.id,
			noArt: fileType === FileType.NO_ART,
			fileType: file.type
		}
	});

	return json(file, { status: 201 });
};
