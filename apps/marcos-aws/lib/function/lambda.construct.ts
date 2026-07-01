import { BucketSet, DynamoTableSet } from '../types.js';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import { fileURLToPath } from 'url';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export function createLambdas({
	scope,
	envName,
	mainStoreId,
	tables,
	buckets
}: {
	scope: Construct;
	envName: string;
	mainStoreId: string;
	tables: DynamoTableSet;
	buckets: BucketSet;
}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const LAMBDA_DIR = `${__dirname}/../../src/lambda/`;

	// REPORTS LAMBDA

	const reportsLogGroup = new LogGroup(scope, `${envName}-generate-reports-log-group`, {
		logGroupName: `/aws/lambda/${envName}-generate-reports-execution-logs`,
		retention: RetentionDays.ONE_MONTH
	});

	const reportsMainStoreLambda = new NodejsFunction(scope, `${envName}-generate-reports`, {
		entry: `${LAMBDA_DIR}generate-reports.lambda.ts`,
		functionName: `${envName}-generate-reports`,
		handler: 'handler',
		memorySize: 512,
		timeout: Duration.seconds(10),
		logGroup: reportsLogGroup,
		runtime: Runtime.NODEJS_24_X,
		architecture: Architecture.ARM_64,
		bundling: {
			minify: true,
			sourceMap: true
		},
		environment: {
			STORE_ID: mainStoreId,
			ORDER_AUDIT_TRAIL_TABLE: tables.analyticsTables.orderAuditTrailTable.table.tableName,
			ORDER_TABLE: tables.storeTables.orderTable.table.tableName,
			CUSTOMER_TABLE: tables.storeTables.customerTable.table.tableName,
			REPORTS_BUCKET: buckets.reportsBucket.bucketName,
			CALCULATED_ITEM_ORDER_TABLE: tables.storeTables.calculatedItemOrderTable.table.tableName
		}
	});

	tables.analyticsTables.orderAuditTrailTable.table.grantReadData(reportsMainStoreLambda);
	tables.storeTables.orderTable.table.grantReadData(reportsMainStoreLambda);
	tables.storeTables.customerTable.table.grantReadData(reportsMainStoreLambda);
	tables.storeTables.calculatedItemOrderTable.table.grantReadData(reportsMainStoreLambda);
	buckets.reportsBucket.grantReadWrite(reportsMainStoreLambda);

	const generateReportsRule = new Rule(scope, `${envName}-reportsEventRule`, {
		schedule: Schedule.cron({
			minute: '50',
			hour: '21'
		})
	});
	generateReportsRule.addTarget(new LambdaFunction(reportsMainStoreLambda));
}
