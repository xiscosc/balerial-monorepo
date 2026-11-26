export const orderAuditTrailTableKeys = {
	partitionKey: 'uuid',
	indexSortKey: 'timestamp',
	indexes: [
		{ name: 'order', partitionKey: 'orderUuid' },
		{ name: 'store', partitionKey: 'storeId' }
	]
} as const;
