export enum QrOrigin {
	LEGACY = 'legacy',
	INTERNAL = 'internal',
	CUSTOMER = 'customer',
	CUSTOMER_V2 = 'customerV2'
}

export type QrOrderInfo = {
	orderId: string;
	origin: QrOrigin;
};
