import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ServerTracking } from '@/server/shared/tracking';
import { QrUtilities } from '@/shared/order/qr.utilities';
import { type QrOrderInfo, type QrOrderSetInfo, QrType } from '@/type/qr.type';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	async default({ request, locals }) {
		const data = await request.formData();
		const scannedText = data.get('scannedText')?.toString();
		const qrData = QrUtilities.parseQr(scannedText);
		if (qrData != null) {
			if (qrData.type === QrType.ORDER) {
				const qrInfo = qrData.info as QrOrderInfo;
				ServerTracking.event('order_scan', {
					user: locals.user!,
					context: locals.posthog,
					orderId: qrInfo.orderId,
					properties: {
						qrOrigin: qrInfo.origin
					}
				});

				return redirect(302, `/orders/${qrInfo.orderId}`);
			}

			if (qrData.type === QrType.ORDER_SET) {
				const qrInfo = qrData.info as QrOrderSetInfo;
				ServerTracking.event('order_set_scan', {
					user: locals.user!,
					context: locals.posthog,
					properties: {
						orderSetId: qrInfo.orderSetId
					}
				});

				return redirect(302, `/order-sets/${qrInfo.orderSetId}`);
			}
		}

		return fail(400, { scannedText, incorrect: true });
	}
};
