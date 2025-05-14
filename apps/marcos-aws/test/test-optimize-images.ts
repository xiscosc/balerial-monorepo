import { S3CreateEvent } from 'aws-lambda';
import 'dotenv/config';
import { handler } from '../src/lambda/optimize-images.lambda.js';

const mockEvent: S3CreateEvent = {
	Records: [
		{
			eventVersion: '2.1',
			eventSource: 'aws:s3',
			awsRegion: 'us-east-1',
			eventTime: new Date().toISOString(),
			eventName: 'ObjectCreated:Put',
			userIdentity: {
				principalId: 'EXAMPLE'
			},
			requestParameters: {
				sourceIPAddress: '127.0.0.1'
			},
			responseElements: {
				'x-amz-request-id': 'EXAMPLE123456789',
				'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH'
			},
			s3: {
				s3SchemaVersion: '1.0',
				configurationId: 'testConfigRule',
				bucket: {
					name: process.env.FILES_BUCKET || 'your_local_or_dev_bucket_name',
					ownerIdentity: {
						principalId: 'EXAMPLE'
					},
					arn: `arn:aws:s3:::${process.env.FILES_BUCKET || 'your_local_or_dev_bucket_name'}`
				},
				object: {
					key: 'abf2237b-268c-41bb-9f28-b09c601a064f/photo/9f812938-b843-40e6-a202-bf5acb5fa85b.png',
					size: 1024,
					eTag: '0123456789abcdef0123456789abcdef',
					sequencer: '0A1B2C3D4E5F678901'
				}
			}
		}
	]
};

console.log('Running optimize-images handler locally...');
handler(mockEvent)
	.then(() => {
		console.log('Handler finished successfully.');
	})
	.catch((error) => {
		console.error('Handler failed:', error);
	});
