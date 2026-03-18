import { AuthService } from '@/server/service/auth.service';
import { ServerTracking } from '@/server/shared/tracking';
import { FileService, OrderService } from '@marcsimolduressonsardina/core/service';
import { FileType, ImageVariant } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals, params }) {
	const { id } = params;
	const config = AuthService.generateConfiguration(locals.user!);
	const fileService = new FileService(config);
	const orderService = new OrderService(config);
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
		context: locals.posthog,
		orderId: id,
		properties: {
			fileId: file.id,
			noArt: fileType === FileType.NO_ART,
			fileType: file.type
		}
	});

	return json(file, { status: 201 });
}
