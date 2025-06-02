import { qrOriginMapCodes, qrOriginMapCodesReverse } from '@/shared/mappings/qr.mapping';
import { QrOrigin, type QrInfo } from '@/type/qr.type';
import { validate as uuidValidate } from 'uuid';

export function generateQrString(info: QrInfo): string {
	return `${qrOriginMapCodes[info.origin]}${info.orderId}`;
}

export function parseQrString(qrString: string | undefined): QrInfo | undefined {
	if (qrString == null) {
		return undefined;
	}

	if (uuidValidate(qrString)) {
		return {
			orderId: qrString,
			origin: QrOrigin.LEGACY
		};
	}

	const origin = qrOriginMapCodesReverse[qrString.slice(0, 2)];
	const orderId = qrString.slice(2);
	if (origin != null && uuidValidate(orderId)) {
		return {
			orderId,
			origin
		};
	}

	try {
		return JSON.parse(atob(qrString)) as QrInfo;
	} catch (e: unknown) {
		return undefined;
	}
}
