import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	PutObjectCommandInput,
	PutObjectTaggingCommand,
	S3Client,
	StorageClass,
	Tag
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type AwsCredentialIdentity } from '@smithy/types';
import type { Readable } from 'stream';

interface S3ObjectHeaders {
	contentType?: string;
	contentLength?: number;
	contentEncoding?: string;
	contentLanguage?: string;
	contentDisposition?: string;
	metadata?: Record<string, string>;
}

export class BalerialCloudFileService {
	private s3Client: S3Client;

	constructor(
		private readonly bucket: string,
		config: { region?: string; credentials?: AwsCredentialIdentity }
	) {
		this.s3Client = new S3Client(config);
	}

	public async getPresignedUploadUrl(
		key: string,
		mimeType: string,
		expire: number = 60,
		metadata?: Record<string, string>,
		intelligentTiering: boolean = false
	): Promise<string> {
		const params: PutObjectCommandInput = {
			Bucket: this.bucket,
			Key: key,
			ContentType: mimeType,
			Metadata: metadata,
			StorageClass: intelligentTiering ? StorageClass.INTELLIGENT_TIERING : undefined
		};

		return await getSignedUrl(this.s3Client, new PutObjectCommand(params), {
			expiresIn: expire
		});
	}

	public async getObjectHeaders(key: string): Promise<S3ObjectHeaders | undefined> {
		try {
			const headResult = await this.s3Client.send(
				new HeadObjectCommand({
					Bucket: this.bucket,
					Key: key
				})
			);

			return {
				contentType: headResult.ContentType,
				contentLength: headResult.ContentLength,
				contentEncoding: headResult.ContentEncoding,
				contentLanguage: headResult.ContentLanguage,
				contentDisposition: headResult.ContentDisposition,
				metadata: headResult.Metadata
			};
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'NotFound') {
				return undefined;
			}
			throw error;
		}
	}

	public async getPresignedDownloadUrl(key: string, expire: number = 60): Promise<string> {
		const params = {
			Bucket: this.bucket,
			Key: key
		};

		return getSignedUrl(this.s3Client, new GetObjectCommand(params), {
			expiresIn: expire
		});
	}

	public async deleteFile(key: string) {
		const deleteParams = {
			Bucket: this.bucket,
			Key: key
		};

		const command = new DeleteObjectCommand(deleteParams);
		await this.s3Client.send(command);
	}

	public async batchDeleteFiles(keys: string[]) {
		const deleteParams = {
			Bucket: this.bucket,
			Delete: {
				Objects: keys.map((key) => ({ Key: key })),
				Quiet: true
			}
		};

		const deleteCommand = new DeleteObjectsCommand(deleteParams);
		await this.s3Client.send(deleteCommand);
	}

	public async getFile(key: string): Promise<{ file: Readable; contentType?: string } | undefined> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key
		});

		try {
			const response = await this.s3Client.send(command);
			return {
				file: response.Body as Readable,
				contentType: response.ContentType
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.name === 'NoSuchKey') {
					return undefined;
				}
			}

			throw new Error(`Failed to get file from S3: ${error}`);
		}
	}

	public async upload(
		key: string,
		body: Buffer,
		contentType?: string,
		intelligentTiering: boolean = false
	) {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
			StorageClass: intelligentTiering ? StorageClass.INTELLIGENT_TIERING : undefined
		});

		try {
			await this.s3Client.send(command);
		} catch (error) {
			throw new Error(`Failed to upload file to S3: ${error}`);
		}
	}

	public async tagFile(key: string, tags: Tag[]): Promise<void> {
		const command = new PutObjectTaggingCommand({
			Bucket: this.bucket,
			Key: key,
			Tagging: {
				TagSet: tags
			}
		});

		try {
			await this.s3Client.send(command);
		} catch (error) {
			throw new Error(`Failed to tag file ${key} with tags ${JSON.stringify(tags)}: ${error}`);
		}
	}
}
