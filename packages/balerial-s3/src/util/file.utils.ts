import { S3EventRecord } from 'aws-lambda';

export function getInfoFromS3EventRecord(record: S3EventRecord): {
	bucketName: string;
	key: string;
} {
	const bucketName = record.s3.bucket.name;
	const key = record.s3.object.key;
	return { bucketName, key };
}
