import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { FileRepositoryDynamoDb } from '../repository/dynamodb/file.repository.dynamodb';

import { Logger } from 'pino';
import type { FileDto } from '../repository/dto/file.dto';
import { OrderAuditTrailService } from './order-audit-trail.service';
import {
	ICoreConfiguration,
	ICoreConfigurationForAWSLambda
} from '../configuration/core-configuration.interface';
import { getClientConfiguration } from '../configuration/configuration.util';
import { FileType, File } from '../types/file.type';
import { getLogger } from '../logger/logger';
import { BalerialCloudFileService } from '@balerial/s3/service';

interface IFileMetadata extends Record<string, string> {
	store_id: string;
	file_id: string;
	order_id: string;
	type: FileType;
}

export type OptmizationAndThumbnailTypeInfo = {
	optimizedContentType: string;
	thumbnailContentType: string;
	optimizedExtension: string;
	thumbnailExtension: string;
};

export class FileService {
	public static readonly optimizedImageSize = { width: 2160 };
	public static readonly optimizedImageQuality = { quality: 80 };
	public static readonly thumbnailImageSize = { width: 80, height: 80 };
	private static readonly expiryTag = {
		Key: 'expiry',
		Value: 'true'
	};
	private repository: FileRepositoryDynamoDb;
	private orderAuditTrailServiceOrder: OrderAuditTrailService;
	private balerialFileCloudService: BalerialCloudFileService;
	private readonly logger: Logger;

	constructor(private readonly config: ICoreConfiguration | ICoreConfigurationForAWSLambda) {
		this.repository = new FileRepositoryDynamoDb(config);
		this.orderAuditTrailServiceOrder = new OrderAuditTrailService(config);
		this.balerialFileCloudService = new BalerialCloudFileService(
			this.config.filesBucket!,
			getClientConfiguration(config)
		);

		if (this.config.filesBucket == null) {
			throw Error('files bucket is needed');
		}

		this.logger = getLogger('FileService', this.config.runInAWSLambda);
	}

	public async createFile(orderId: string, fileName: string): Promise<File> {
		const mimeType = mime.lookup(fileName);
		if (mimeType === false) throw Error('Invalid filename');
		const id = uuidv4();
		const type = FileService.classifyMimeType(mimeType);
		const file: File = {
			orderId,
			id,
			type,
			originalFilename: fileName
		};
		const storageKey = FileService.generateStorageKey(file, fileName);
		const fileDto = FileService.toDto(file, storageKey);
		const metadata: IFileMetadata = {
			store_id: this.config.storeId,
			order_id: orderId,
			file_id: id,
			type
		};
		const uploadUrl = await this.balerialFileCloudService.getPresignedUploadUrl(
			storageKey,
			mimeType,
			300,
			metadata,
			file.type !== FileType.PHOTO
		);
		file.uploadUrl = uploadUrl;
		await Promise.all([
			this.repository.createFile(fileDto),
			this.orderAuditTrailServiceOrder.logOrderFileCreated(orderId, `${fileName} || ${id}`)
		]);
		return file;
	}

	public async createNoArtFile(orderId: string): Promise<File> {
		const id = uuidv4();
		const file: File = {
			orderId,
			id,
			type: FileType.NO_ART,
			originalFilename: 'Sin Obra'
		};
		const fileDto = FileService.toDto(file, 'no_key');
		await Promise.all([
			this.repository.createFile(fileDto),
			this.orderAuditTrailServiceOrder.logOrderFileCreated(
				orderId,
				`${file.originalFilename} || ${id}`
			)
		]);
		return file;
	}

	public async storeOptimizations(
		orderId: string,
		id: string,
		optimizedImage: Buffer,
		thumbnailImage: Buffer,
		optimizationAndThumbnailTypeInfo?: OptmizationAndThumbnailTypeInfo
	) {
		const fileDto = await this.repository.getFile(orderId, id);
		if (fileDto == null) return;
		const file = FileService.fromDto(fileDto);

		if (file.type !== FileType.PHOTO) {
			return;
		}

		if (fileDto.optimizedKey != null && fileDto.thumbnailKey != null) {
			return;
		}

		const originalFileHeaders = await this.balerialFileCloudService.getObjectHeaders(fileDto.key);

		if (originalFileHeaders == null) {
			return;
		}

		const originalFileContentType = originalFileHeaders.contentType;

		if (fileDto.optimizedKey == null) {
			fileDto.optimizedKey = `optimized/${fileDto.key}${optimizationAndThumbnailTypeInfo?.optimizedExtension ?? ''}`;
			await this.balerialFileCloudService.upload(
				fileDto.optimizedKey,
				optimizedImage,
				optimizationAndThumbnailTypeInfo?.optimizedContentType ?? originalFileContentType,
				true
			);
		}

		if (fileDto.thumbnailKey == null) {
			fileDto.thumbnailKey = `thumbnail/${fileDto.key}${optimizationAndThumbnailTypeInfo?.thumbnailExtension ?? ''}`;
			await this.balerialFileCloudService.upload(
				fileDto.thumbnailKey,
				thumbnailImage,
				optimizationAndThumbnailTypeInfo?.thumbnailContentType ?? originalFileContentType
			);
		}

		await this.repository.createFile(fileDto);

		if (fileDto.optimizedKey != null) {
			await this.balerialFileCloudService.tagFile(fileDto.key, [FileService.expiryTag]);
		}
	}

	public async getFile(orderId: string, id: string): Promise<File | undefined> {
		const fileDto = await this.repository.getFile(orderId, id);
		if (fileDto == null) return undefined;
		return this.processFileToDownload(fileDto);
	}

	public async optimizePhotoStorage(): Promise<void> {
		this.logger.info('Optimizing photo storage');
		const fileDtos = await this.repository.getOptimizedPhotoFileOriginalKeys();
		const originalKeys = fileDtos.map((dto) => dto.key!);
		this.logger.info(`Found ${originalKeys.length} files to optimize`);

		const batches = [];
		for (let i = 0; i < originalKeys.length; i += 50) {
			batches.push(originalKeys.slice(i, i + 50));
		}

		this.logger.info(`Processing ${batches.length} batches`);
		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			this.logger.info(`Processing batch ${i + 1} of ${batches.length}`);
			const promises = batch.map((key) =>
				this.balerialFileCloudService.tagFile(key, [FileService.expiryTag])
			);
			const results = await Promise.allSettled(promises);
			results.forEach((result) => {
				if (result.status === 'rejected') {
					this.logger.error({ err: result.reason }, 'tagFile promise failed');
				}
			});
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	public async getPhotoAndMetadataFromStorage({
		bucketName,
		key
	}: {
		bucketName: string;
		key: string;
	}): Promise<
		{ content: Uint8Array<ArrayBufferLike>; orderId: string; fileId: string } | undefined
	> {
		if (bucketName !== this.config.filesBucket) {
			throw Error('Incorrect bucket');
		}

		const headers = await this.balerialFileCloudService.getObjectHeaders(key);
		const metadata = headers?.metadata as IFileMetadata | undefined;

		if (
			metadata == null ||
			metadata.store_id !== this.config.storeId ||
			metadata.type !== FileType.PHOTO
		) {
			return undefined;
		}

		const result = await this.balerialFileCloudService.getFile(key);
		return result
			? {
					content: result.file,
					orderId: metadata.order_id,
					fileId: metadata.file_id
				}
			: undefined;
	}

	public async getFilesByOrder(orderId: string): Promise<File[]> {
		const fileDtos = await this.repository.getFilesByOrder(orderId);
		const promises = fileDtos.map((dto) => this.processFileToDownload(dto));
		return await Promise.all(promises);
	}

	public async deleteFile(orderId: string, id: string) {
		const dto = await this.repository.getFile(orderId, id);
		if (dto == null) return;
		const promises = [
			this.repository.deleteFile(orderId, id),
			this.orderAuditTrailServiceOrder.logOrderFileDeleted(
				orderId,
				`${dto.originalFilename} || ${dto.fileUuid}`
			)
		];

		const file = FileService.fromDto(dto);
		if (file.type !== FileType.NO_ART) {
			promises.push(
				...FileService.getAllFileKeys(dto).map((key) =>
					this.balerialFileCloudService.tagFile(key, [FileService.expiryTag])
				)
			);
		}

		const results = await Promise.allSettled(promises);
		results.forEach((result) => {
			if (result.status === 'rejected') {
				this.logger.error({ err: result.reason }, 'deleteFile promise failed');
			}
		});
	}

	private async processFileToDownload(fileDto: FileDto): Promise<File> {
		const downloadUrl = await this.balerialFileCloudService.getPresignedDownloadUrl(
			fileDto.optimizedKey ?? fileDto.key,
			600
		);

		const thumbnailDownloadUrl = fileDto.thumbnailKey
			? await this.balerialFileCloudService.getPresignedDownloadUrl(fileDto.thumbnailKey, 600)
			: undefined;

		return FileService.fromDto(fileDto, downloadUrl, thumbnailDownloadUrl);
	}

	private static toDto(file: File, key: string): FileDto {
		return {
			orderUuid: file.orderId,
			fileUuid: file.id,
			type: file.type,
			originalFilename: file.originalFilename,
			key
		};
	}

	private static fromDto(
		fileDto: FileDto,
		downloadUrl?: string,
		thumbnailDownloadUrl?: string
	): File {
		return {
			orderId: fileDto.orderUuid,
			id: fileDto.fileUuid,
			type: fileDto.type as FileType,
			originalFilename: fileDto.originalFilename,
			downloadUrl,
			thumbnailDownloadUrl
		};
	}

	private static classifyMimeType(mimeType: string): FileType {
		if (mimeType.startsWith('image/')) {
			return FileType.PHOTO;
		} else if (mimeType.startsWith('video/')) {
			return FileType.VIDEO;
		} else {
			return FileType.OTHER;
		}
	}

	private static generateStorageKey(file: File, fileName: string) {
		const lastDotIndex = fileName.lastIndexOf('.');
		const extension =
			lastDotIndex === -1 || lastDotIndex === 0 ? '' : fileName.substring(lastDotIndex + 1);
		return `${file.orderId}/${file.type}/${file.id}.${extension.toLowerCase()}`;
	}

	private static getAllFileKeys(fileDto: FileDto): string[] {
		return [fileDto.key, fileDto.optimizedKey, fileDto.thumbnailKey].filter((key) => key != null);
	}
}
