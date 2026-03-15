export enum FileType {
	VIDEO = 'video',
	PHOTO = 'photo',
	OTHER = 'other',
	NO_ART = 'no_art'
}

export enum ImageVariant {
	ORIGINAL = 'original',
	OPTIMIZED = 'optimized',
	THUMBNAIL = 'thumbnail'
}

export type File = {
	orderId: string;
	id: string;
	originalFilename: string;
	downloadUrl?: string;
	thumbnailDownloadUrl?: string;
	uploadUrl?: string;
	type: FileType;
};
