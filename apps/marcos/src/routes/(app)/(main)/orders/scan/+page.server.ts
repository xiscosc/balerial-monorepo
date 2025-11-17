import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { trackServerEvent } from '@/server/shared/server-analytics/posthog';
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
				trackServerEvent(
					locals.user!,
					{
						event: 'order_scan',
						orderId: qrInfo.orderId,
						properties: {
							qrOrigin: qrInfo.origin
						}
					},
					locals.posthog
				);

				return redirect(302, `/orders/${qrInfo.orderId}`);
			}

			if (qrData.type === QrType.ORDER_SET) {
				const qrInfo = qrData.info as QrOrderSetInfo;
				trackServerEvent(
					locals.user!,
					{
						event: 'order_set_scan',
						properties: {
							orderSetId: qrInfo.orderSetId
						}
					},
					locals.posthog
				);

				return redirect(302, `/order-sets/${qrInfo.orderSetId}`);
			}
		}

		return fail(400, { scannedText, incorrect: true });
	}
};
