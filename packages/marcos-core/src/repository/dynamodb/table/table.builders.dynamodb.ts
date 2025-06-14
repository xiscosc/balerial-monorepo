import { BalerialDynamoTableBuilder } from '@balerial/dynamo/table';
import { DynamoDbIndexKeyType } from '@balerial/dynamo/type';

export enum CustomerSecondaryIndexNames {
	Store = 'store'
}

export enum ListPricingSecondaryIndexNames {
	Type = 'type'
}

export enum OrderAuditTrailSecondaryIndexNames {
	Order = 'order',
	Store = 'store'
}

export enum OrderSecondaryIndexNames {
	Customer = 'customer',
	ShortId = 'shortId',
	Status = 'status',
	Store = 'store',
	PublicId = 'publicId'
}

export const calculatedItemTableBuilder = new BalerialDynamoTableBuilder()
	.setPrimaryIndex('orderUuid', DynamoDbIndexKeyType.string)
	.setPublicPrimaryIndex();

export const configTableBuilder = new BalerialDynamoTableBuilder().setPrimaryIndex(
	'storeId',
	DynamoDbIndexKeyType.string,
	'id',
	DynamoDbIndexKeyType.string
);

export const customerTableBuilder = new BalerialDynamoTableBuilder()
	.setPrimaryIndex('uuid', DynamoDbIndexKeyType.string)
	.addSecondaryIndex(
		CustomerSecondaryIndexNames.Store,
		'storeId',
		DynamoDbIndexKeyType.string,
		'phone',
		DynamoDbIndexKeyType.string
	)
	.setPublicPrimaryIndex();

export const fileTableBuilder = new BalerialDynamoTableBuilder().setPrimaryIndex(
	'orderUuid',
	DynamoDbIndexKeyType.string,
	'fileUuid',
	DynamoDbIndexKeyType.string
);

export const listPricingTableBuilder = new BalerialDynamoTableBuilder()
	.setPrimaryIndex('uuid', DynamoDbIndexKeyType.string)
	.addSecondaryIndex(
		ListPricingSecondaryIndexNames.Type,
		'type',
		DynamoDbIndexKeyType.string,
		'id',
		DynamoDbIndexKeyType.string
	);

export const orderAuditTrailTableBuilder = new BalerialDynamoTableBuilder()
	.setPrimaryIndex('uuid', DynamoDbIndexKeyType.string)
	.addSecondaryIndex(
		OrderAuditTrailSecondaryIndexNames.Order,
		'orderUuid',
		DynamoDbIndexKeyType.string,
		'timestamp',
		DynamoDbIndexKeyType.number
	)
	.addSecondaryIndex(
		OrderAuditTrailSecondaryIndexNames.Store,
		'storeId',
		DynamoDbIndexKeyType.string,
		'timestamp',
		DynamoDbIndexKeyType.number
	);

export const orderTableBuilder = new BalerialDynamoTableBuilder()
	.setPrimaryIndex('uuid', DynamoDbIndexKeyType.string)
	.addSecondaryIndex(
		OrderSecondaryIndexNames.Customer,
		'customerUuid',
		DynamoDbIndexKeyType.string,
		'timestamp',
		DynamoDbIndexKeyType.number
	)
	.addSecondaryIndex(OrderSecondaryIndexNames.ShortId, 'shortId', DynamoDbIndexKeyType.string)
	.addSecondaryIndex(
		OrderSecondaryIndexNames.Status,
		'status',
		DynamoDbIndexKeyType.string,
		'timestamp',
		DynamoDbIndexKeyType.number
	)
	.addSecondaryIndex(
		OrderSecondaryIndexNames.Store,
		'storeId',
		DynamoDbIndexKeyType.string,
		'timestamp',
		DynamoDbIndexKeyType.number
	)
	.addSecondaryIndex(OrderSecondaryIndexNames.PublicId, 'publicId', DynamoDbIndexKeyType.string)
	.setPublicSecondaryIndexes([OrderSecondaryIndexNames.ShortId]);
