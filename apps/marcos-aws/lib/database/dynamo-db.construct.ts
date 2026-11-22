import { AttributeType, BillingMode, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import type { DynamoTableSet, TableInfo } from '../types';
import { configTableKeys } from './config-table';
import { orderAuditTrailTableKeys } from './order-audit-trail-table';
import { orderSetTableKeys } from './order-set-table';
import {
	customerTableBuilder,
	fileTableBuilder,
	orderTableBuilder,
	listPricingTableBuilder,
	calculatedItemTableBuilder
} from '@marcsimolduressonsardina/core/db';

import { IPrimaryDynamoDbIndex, ISecondaryDynamoDbIndex } from '@balerial/dynamo/type';
import { generateCdkIndexParams } from '@balerial/dynamo/tools';

export function createDynamoTables({
	scope,
	envName
}: {
	scope: Construct;
	envName: string;
}): DynamoTableSet {
	return {
		storeTables: {
			customerTable: createCustomerTable(scope, envName),
			orderTable: createOrderTable(scope, envName),
			calculatedItemOrderTable: createCalculatedItemOrderTable(scope, envName),
			listPricingTable: createListPricingTable(scope, envName),
			fileTable: createFileTable(scope, envName),
			configTable: createConfigTable(scope, envName),
			orderSetTable: createOrderSetTable(scope, envName)
		},
		analyticsTables: {
			orderAuditTrailTable: createOrderAuditTrailTable(scope, envName)
		}
	};
}

function createCustomerTable(scope: Construct, envName: string): TableInfo {
	const balerialTable = customerTableBuilder.setTableName(`${envName}-customer-v2`).build();
	const table = createTable(
		scope,
		envName,
		`${envName}-customer-v2`,
		balerialTable.getPrimaryIndex()
	);

	addSecondaryIndexes(balerialTable.getSecondaryIndexes(), table);
	return {
		table,
		primaryIndexIsPublic: balerialTable.getPrimaryIndexIsPublic(),
		publicSecondaryIndexes: balerialTable.getPublicSecondaryIndexNames()
	};
}

function createConfigTable(scope: Construct, envName: string): TableInfo {
	const tableName = `${envName}-config`;
	const table = new Table(scope, `${tableName}-table`, {
		tableName,
		partitionKey: { name: configTableKeys.partitionKey, type: AttributeType.STRING },
		sortKey: { name: configTableKeys.sortKey, type: AttributeType.STRING },
		billingMode: BillingMode.PAY_PER_REQUEST,
		pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: envName === 'prod' }
	});
	return {
		table,
		primaryIndexIsPublic: false,
		publicSecondaryIndexes: []
	};
}

function createFileTable(scope: Construct, envName: string): TableInfo {
	const balerialTable = fileTableBuilder.setTableName(`${envName}-file`).build();
	const table = createTable(scope, envName, `${envName}-file`, balerialTable.getPrimaryIndex());
	addSecondaryIndexes(balerialTable.getSecondaryIndexes(), table);
	return {
		table,
		primaryIndexIsPublic: balerialTable.getPrimaryIndexIsPublic(),
		publicSecondaryIndexes: balerialTable.getPublicSecondaryIndexNames()
	};
}

function createOrderSetTable(scope: Construct, envName: string): TableInfo {
	const tableName = `${envName}-order-set`;
	const { partitionKey, hashIndex } = orderSetTableKeys;
	const table = new Table(scope, `${tableName}-table`, {
		tableName,
		partitionKey: { name: partitionKey, type: AttributeType.STRING },
		billingMode: BillingMode.PAY_PER_REQUEST,
		pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: envName === 'prod' }
	});
	table.addGlobalSecondaryIndex({
		indexName: hashIndex.name,
		partitionKey: { name: hashIndex.partitionKey, type: AttributeType.STRING },
		projectionType: ProjectionType.ALL
	});
	return {
		table,
		primaryIndexIsPublic: false,
		publicSecondaryIndexes: []
	};
}

function createOrderTable(scope: Construct, envName: string): TableInfo {
	const balerialTable = orderTableBuilder.setTableName(`${envName}-order-v2`).build();
	const table = createTable(scope, envName, `${envName}-order-v2`, balerialTable.getPrimaryIndex());
	addSecondaryIndexes(balerialTable.getSecondaryIndexes(), table);
	return {
		table,
		primaryIndexIsPublic: balerialTable.getPrimaryIndexIsPublic(),
		publicSecondaryIndexes: balerialTable.getPublicSecondaryIndexNames()
	};
}

function createListPricingTable(scope: Construct, envName: string): TableInfo {
	const balerialTable = listPricingTableBuilder.setTableName(`${envName}-list-pricing-v2`).build();
	const table = createTable(
		scope,
		envName,
		`${envName}-list-pricing-v2`,
		balerialTable.getPrimaryIndex()
	);
	addSecondaryIndexes(balerialTable.getSecondaryIndexes(), table);
	return {
		table,
		primaryIndexIsPublic: balerialTable.getPrimaryIndexIsPublic(),
		publicSecondaryIndexes: balerialTable.getPublicSecondaryIndexNames()
	};
}

function createCalculatedItemOrderTable(scope: Construct, envName: string): TableInfo {
	const balerialTable = calculatedItemTableBuilder
		.setTableName(`${envName}-calculated-item-order`)
		.build();
	const table = createTable(
		scope,
		envName,
		`${envName}-calculated-item-order`,
		balerialTable.getPrimaryIndex()
	);
	addSecondaryIndexes(balerialTable.getSecondaryIndexes(), table);
	return {
		table,
		primaryIndexIsPublic: balerialTable.getPrimaryIndexIsPublic(),
		publicSecondaryIndexes: balerialTable.getPublicSecondaryIndexNames()
	};
}

function createOrderAuditTrailTable(scope: Construct, envName: string): TableInfo {
	const tableName = `${envName}-order-audit-trail-v3`;
	const { partitionKey, indexSortKey, indexes } = orderAuditTrailTableKeys;
	const table = new Table(scope, `${tableName}-table`, {
		tableName,
		partitionKey: { name: partitionKey, type: AttributeType.STRING },
		billingMode: BillingMode.PAY_PER_REQUEST,
		pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: envName === 'prod' }
	});
	for (const index of indexes) {
		table.addGlobalSecondaryIndex({
			indexName: index.name,
			partitionKey: { name: index.partitionKey, type: AttributeType.STRING },
			sortKey: { name: indexSortKey, type: AttributeType.NUMBER },
			projectionType: ProjectionType.ALL
		});
	}
	return {
		table,
		primaryIndexIsPublic: false,
		publicSecondaryIndexes: []
	};
}

function createTable(
	scope: Construct,
	envName: string,
	tableName: string,
	index: IPrimaryDynamoDbIndex
): Table {
	return new Table(scope, `${tableName}-table`, {
		tableName,
		...generateCdkIndexParams(index),
		billingMode: BillingMode.PAY_PER_REQUEST,
		pointInTimeRecoverySpecification: {
			pointInTimeRecoveryEnabled: envName === 'prod'
		}
	});
}

function addSecondaryIndexes(indexes: ISecondaryDynamoDbIndex[], table: Table) {
	indexes.forEach((index) => {
		table.addGlobalSecondaryIndex({
			indexName: index.indexName,
			...generateCdkIndexParams(index)
		});
	});
}
