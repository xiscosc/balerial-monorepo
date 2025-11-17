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

export type QrOrderSetInfo = {
	orderSetId: string;
};

export enum QrType {
	ORDER = 'order',
	ORDER_SET = 'orderSet'
}

export type QrData = {
	type: QrType;
	info: QrOrderInfo | QrOrderSetInfo;
};
