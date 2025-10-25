import type { StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Bucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export interface MssStackProps extends StackProps {
	envName: string;
	allowedUploadOrigins: string[];
	mainStoreId: string;
	postHogKey: string;
}

export type TableInfo = {
	table: Table;
	primaryIndexIsPublic: boolean;
	publicSecondaryIndexes: string[];
};

export type StoreTables = {
	customerTable: TableInfo;
	orderTable: TableInfo;
	calculatedItemOrderTable: TableInfo;
	listPricingTable: TableInfo;
	fileTable: TableInfo;
	configTable: TableInfo;
	orderSetTable: TableInfo;
};

export type AnalyticsTables = {
	orderAuditTrailTable: TableInfo;
};

export type DynamoTableSet = {
	storeTables: StoreTables;
	analyticsTables: AnalyticsTables;
};

export type BucketSet = {
	moldPricesBucket: Bucket;
	filesBucket: Bucket;
	reportsBucket: Bucket;
};

export type QueueSet = {
	orderAuditTrailQueue: Queue;
};
