import { QrOrigin } from '@/type/qr.type';

export const qrOriginMapCodesLegacy: Record<QrOrigin, string> = {
	[QrOrigin.LEGACY]: 'L/',
	[QrOrigin.INTERNAL]: 'I/',
	[QrOrigin.CUSTOMER]: 'C/',
	[QrOrigin.CUSTOMER_V2]: 'K/'
};

export const qrOriginMapCodesUrn: Record<QrOrigin, string> = {
	[QrOrigin.LEGACY]: 'legacy',
	[QrOrigin.INTERNAL]: 'internal',
	[QrOrigin.CUSTOMER]: 'customer',
	[QrOrigin.CUSTOMER_V2]: 'customer-v2'
};

export const qrOriginMapCodesLegacyReverse: Record<string, QrOrigin> = Object.fromEntries(
	Object.entries(qrOriginMapCodesLegacy).map(([key, value]) => [value, key as QrOrigin])
);

export const qrOriginMapCodesUrnReverse: Record<string, QrOrigin> = Object.fromEntries(
	Object.entries(qrOriginMapCodesUrn).map(([key, value]) => [value, key as QrOrigin])
);

export const qrOriginCodes = Object.values(qrOriginMapCodesLegacy);
