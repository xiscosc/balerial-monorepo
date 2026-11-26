import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function createDocumentClient(config: DynamoDBClientConfig) {
	return DynamoDBDocumentClient.from(new DynamoDBClient(config), {
		marshallOptions: { removeUndefinedValues: true }
	});
}
