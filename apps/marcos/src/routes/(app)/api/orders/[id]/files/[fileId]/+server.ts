import type { RequestHandler } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { json } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { id, fileId } = params;
	const { fileService, orderService } = locals.services!;
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	await fileService.deleteFile(id, fileId);

	await ServerTracking.event('order_file_deleted', {
		user: locals.user!,
		context: locals.trackingContext,
		properties: {
			fileId: fileId
		},
		orderId: id
	});

	return json({ result: 'Deleted' }, { status: 200 });
};

export const GET: RequestHandler = async ({ locals, params }) => {
	const { id, fileId } = params;
	const { fileService, orderService } = locals.services!;
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	const file = await fileService.getFile(id, fileId);
	if (file == null) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	return json(file);
};
