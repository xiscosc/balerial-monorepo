import { Readable } from 'stream';
import { S3EventRecord } from 'aws-lambda';

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Uint8Array[] = [];
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

export function getInfoFromS3EventRecord(record: S3EventRecord): {
	bucketName: string;
	key: string;
} {
	const bucketName = record.s3.bucket.name;
	const key = record.s3.object.key;
	return { bucketName, key };
}
