import {
	qrOriginMapCodesUrn,
	qrOriginMapCodesLegacyReverse,
	qrOriginMapCodesUrnReverse
} from '@/shared/mappings/qr.mapping';
import {
	QrOrigin,
	type QrOrderInfo,
	type QrOrderSetInfo,
	type QrData,
	QrType
} from '@/type/qr.type';
import { validate as uuidValidate } from 'uuid';

export class QrUtilities {
	public static generateQrStringForOrder(info: QrOrderInfo): string {
		return `urn:order:${info.orderId}:${qrOriginMapCodesUrn[info.origin]}`;
	}

	public static generateQrStringForOrderSet(info: QrOrderSetInfo): string {
		return `urn:order-set:${info.orderSetId}`;
	}

	public static parseQr(qrString: string | undefined): QrData | undefined {
		const orderInfo = this.parseQrOrderString(qrString);
		if (orderInfo != null) {
			return {
				type: QrType.ORDER,
				info: orderInfo
			};
		}

		const orderSetInfo = this.parseQrOrderSetString(qrString);
		if (orderSetInfo != null) {
			return {
				type: QrType.ORDER_SET,
				info: orderSetInfo
			};
		}

		return undefined;
	}

	public static parseQrOrderSetString(qrString: string | undefined): QrOrderSetInfo | undefined {
		if (qrString == null) {
			return undefined;
		}

		if (qrString.startsWith('urn:order-set:')) {
			const parts = qrString.split(':');
			if (parts.length === 3 && parts[0] === 'urn' && parts[1] === 'order-set') {
				const orderSetId = parts[2];
				if (uuidValidate(orderSetId)) {
					return {
						orderSetId
					};
				}
			}
		}

		return undefined;
	}

	public static parseQrOrderString(qrString: string | undefined): QrOrderInfo | undefined {
		if (qrString == null) {
			return undefined;
		}

		if (qrString.startsWith('urn:order:')) {
			const parts = qrString.split(':');
			if (parts.length === 4 && parts[0] === 'urn' && parts[1] === 'order') {
				const orderId = parts[2];
				const origin = qrOriginMapCodesUrnReverse[parts[3]];
				if (uuidValidate(orderId) && origin != null) {
					return {
						orderId,
						origin
					};
				}
			}
		}

		return this.parseLegacyQrString(qrString);
	}

	private static parseLegacyQrString(qrString: string | undefined): QrOrderInfo | undefined {
		if (qrString == null) {
			return undefined;
		}

		if (uuidValidate(qrString)) {
			return {
				orderId: qrString,
				origin: QrOrigin.LEGACY
			};
		}

		const origin = qrOriginMapCodesLegacyReverse[qrString.slice(0, 2)];
		const orderId = qrString.slice(2);
		if (origin != null && uuidValidate(orderId)) {
			return {
				orderId,
				origin
			};
		}

		try {
			return JSON.parse(atob(qrString)) as QrOrderInfo;
		} catch {
			return undefined;
		}
	}
}
