export type Changelog = {
	version: number;
	title: string;
	items: ChangelogItem[];
};

export enum ChangelogItemType {
	NEW = 'new',
	MINOR_CHANGE = 'minor-change',
	SECURITY = 'security',
	TECHNICAL = 'technical'
}

export type ChangelogItem = {
	text: string;
	type: ChangelogItemType;
};
