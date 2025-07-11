import { ICoreConfigurationForAWSLambda } from '@marcsimolduressonsardina/core/config';
import { getLoggerForLambda } from '@marcsimolduressonsardina/core/logger';
import {
	FileService,
	OptmizationAndThumbnailTypeInfo
} from '@marcsimolduressonsardina/core/service';
import { AppUser } from '@marcsimolduressonsardina/core/type';
import { S3EventRecord } from 'aws-lambda';
import sharp from 'sharp';
import { PostHog } from 'posthog-node';
import type { Logger } from 'pino';
import { createPostHogClient } from './utils/posthog.utils';
import { getInfoFromS3EventRecord, streamToBuffer } from '@balerial/s3/util';

export type OptimizeImagesInput = {
	s3Records: S3EventRecord[];
	envName: string;
	storeId?: string;
	filesBucketName?: string;
	filesTableName?: string;
	postHogKey?: string;
};

export async function lambdaOptimizeImages({
	s3Records,
	envName,
	storeId,
	filesBucketName,
	filesTableName,
	postHogKey
}: OptimizeImagesInput): Promise<void> {
	const user: AppUser = {
		id: 'automation@lambda.aws',
		storeId: storeId ?? '',
		name: 'AWS LAMBDA',
		priceManager: true
	};
	const configuration: ICoreConfigurationForAWSLambda = {
		runInAWSLambda: true,
		storeId: user.storeId,
		filesBucket: filesBucketName,
		fileTable: filesTableName,
		orderAuditTrailTable: 'not-used',
		user
	};

	const logger = getLoggerForLambda();
	const postHogClient = postHogKey ? createPostHogClient(postHogKey) : undefined;
	const fileService = new FileService(configuration);
	const promises = s3Records.map((record) =>
		processImage(record, fileService, envName, logger, postHogClient)
	);
	await Promise.all(promises);

	if (postHogClient) {
		await postHogClient.shutdown();
	}
}

async function processImage(
	record: S3EventRecord,
	fileService: FileService,
	env: string,
	logger: Logger,
	posthogClient?: PostHog
) {
	const eventInfo = getInfoFromS3EventRecord(record);
	let orderIdFromFile: string | undefined;

	try {
		const originalImageData = await fileService.getPhotoAndMetadataFromStorage(eventInfo);

		if (originalImageData == null) {
			return;
		}

		const { content, orderId, fileId } = originalImageData;
		orderIdFromFile = orderId;

		const buffer = await streamToBuffer(content);
		const optimizedImage = await sharp(buffer)
			.resize(FileService.optimizedImageSize)
			.webp(FileService.optimizedImageQuality)
			.toBuffer();
		const thumbnail = await sharp(buffer).resize(FileService.thumbnailImageSize).webp().toBuffer();

		const types: OptmizationAndThumbnailTypeInfo = {
			optimizedContentType: 'image/webp',
			thumbnailContentType: 'image/webp',
			optimizedExtension: '.webp',
			thumbnailExtension: '.webp'
		};

		await fileService.storeOptimizations(orderId, fileId, optimizedImage, thumbnail, types);
	} catch (error: unknown) {
		const errorProps = {
			eventInfo,
			orderId: orderIdFromFile,
			env
		};

		logger.error(
			{ ...errorProps, error: error instanceof Error ? error.message : String(error) },
			'Error processing image'
		);

		if (posthogClient) {
			posthogClient.captureException(error, undefined, errorProps);
		}
	}
}
