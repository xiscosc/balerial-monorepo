import { QrOrigin } from '@/type/qr.type';

export const qrOriginMapCodes: Record<QrOrigin, string> = {
	[QrOrigin.LEGACY]: 'L/',
	[QrOrigin.INTERNAL]: 'I/',
	[QrOrigin.CUSTOMER]: 'C/',
	[QrOrigin.CUSTOMER_V2]: 'K/'
};

export const qrOriginMapCodesReverse: Record<string, QrOrigin> = Object.fromEntries(
	Object.entries(qrOriginMapCodes).map(([key, value]) => [value, key as QrOrigin])
);

export const qrOriginCodes = Object.values(qrOriginMapCodes);
