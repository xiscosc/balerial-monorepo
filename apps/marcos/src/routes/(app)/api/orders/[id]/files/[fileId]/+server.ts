import { AuthService } from '@/server/service/auth.service';
import { ServerTracking } from '@/server/shared/tracking';
import { FileService, OrderService } from '@marcsimolduressonsardina/core/service';
import { json } from '@sveltejs/kit';

export async function DELETE({ locals, params }) {
	const { id, fileId } = params;
	const config = AuthService.generateConfiguration(locals.user!);
	const fileService = new FileService(config);
	const orderService = new OrderService(config);
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	await fileService.deleteFile(id, fileId);

	await ServerTracking.event('order_file_deleted', {
		user: locals.user!,
		context: locals.posthog,
		properties: {
			fileId: fileId
		},
		orderId: id
	});

	return json({ result: 'Deleted' }, { status: 200 });
}

export async function GET({ locals, params }) {
	const { id, fileId } = params;
	const config = AuthService.generateConfiguration(locals.user!);
	const fileService = new FileService(config);
	const orderService = new OrderService(config);
	const order = await orderService.getOrderById(id);
	if (order == null) {
		return json({ error: 'Order not found' }, { status: 404 });
	}

	const file = await fileService.getFile(id, fileId);
	if (file == null) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	return json(file);
}
