export const orderSetTableKeys = {
	partitionKey: 'uuid',
	hashIndex: { name: 'hash', partitionKey: 'hash' }
} as const;
