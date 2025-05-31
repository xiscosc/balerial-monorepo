import { DynamoFilterElement } from '../type/filter.dynamodb.type';
import {
	ISecondaryDynamoDbIndex,
	IPrimaryDynamoDbIndex,
	DynamoDbIndexType,
	DynamoDbIndexKeyType
} from '../type/index.dynamodb.type';

export class BalerialDynamoTable {
	private constructor(
		private readonly tableName: string,
		private primaryIndex: IPrimaryDynamoDbIndex,
		private secondaryIndexesMap: Map<string, ISecondaryDynamoDbIndex>,
		private defaultFilters: DynamoFilterElement[],
		private publicSecondaryIndexNames: string[],
		private primaryIndexIsPublic: boolean
	) {}

	public static create(builder: BalerialDynamoTableBuilder): BalerialDynamoTable {
		const primaryIndex = builder.getPrimaryIndex();
		const tableName = builder.getTableName();

		if (!primaryIndex) {
			throw new Error('Primary index must be set');
		}
		if (!tableName) {
			throw new Error('Table name must be set');
		}

		return new BalerialDynamoTable(
			tableName,
			primaryIndex,
			builder.getSecondaryIndexesMap(),
			builder.getDefaultFilters(),
			builder.getPublicSecondaryIndexNames(),
			builder.getPrimaryIndexIsPublic()
		);
	}

	public getPrimaryIndex(): IPrimaryDynamoDbIndex {
		return this.primaryIndex;
	}

	public getSecondaryIndexes(): ISecondaryDynamoDbIndex[] {
		return Array.from(this.secondaryIndexesMap.values());
	}

	public getDefaultFilters(): DynamoFilterElement[] {
		return this.defaultFilters;
	}

	public getSecondaryIndex(indexName: string): ISecondaryDynamoDbIndex {
		const index = this.secondaryIndexesMap.get(indexName);
		if (!index) {
			throw new Error(`Secondary index ${indexName} not found`);
		}
		return index;
	}

	public getTableName(): string {
		return this.tableName;
	}

	public getPublicSecondaryIndexNames(): string[] {
		return this.publicSecondaryIndexNames;
	}

	public getPrimaryIndexIsPublic(): boolean {
		return this.primaryIndexIsPublic;
	}
}

export class BalerialDynamoTableBuilder {
	private primaryIndex?: IPrimaryDynamoDbIndex;
	private secondaryIndexesMap: Map<string, ISecondaryDynamoDbIndex> = new Map();
	private tableName?: string;
	private defaultFilters: DynamoFilterElement[] = [];
	private publicSecondaryIndexNames: string[] = [];
	private primaryIndexIsPublic: boolean = false;

	public getPrimaryIndex(): IPrimaryDynamoDbIndex | undefined {
		return this.primaryIndex;
	}

	public getSecondaryIndexesMap(): Map<string, ISecondaryDynamoDbIndex> {
		return this.secondaryIndexesMap;
	}

	public getTableName(): string | undefined {
		return this.tableName;
	}

	public getDefaultFilters(): DynamoFilterElement[] {
		return this.defaultFilters;
	}

	public getPublicSecondaryIndexNames(): string[] {
		return this.publicSecondaryIndexNames;
	}

	public getPrimaryIndexIsPublic(): boolean {
		return this.primaryIndexIsPublic;
	}

	public setPrimaryIndex(
		partitionKeyName: string,
		partitionKeyType: DynamoDbIndexKeyType,
		sortKeyName?: string,
		sortKeyType?: DynamoDbIndexKeyType
	): this {
		this.primaryIndex = {
			type: DynamoDbIndexType.primary,
			partitionKeyName,
			partitionKeyType,
			sortKeyName,
			sortKeyType
		};
		return this;
	}

	public addSecondaryIndex(
		indexName: string,
		partitionKeyName: string,
		partitionKeyType: DynamoDbIndexKeyType,
		sortKeyName?: string,
		sortKeyType?: DynamoDbIndexKeyType
	): this {
		this.secondaryIndexesMap.set(indexName, {
			type: DynamoDbIndexType.secondary,
			indexName,
			partitionKeyName,
			partitionKeyType,
			sortKeyName,
			sortKeyType
		});
		return this;
	}

	public setPublicSecondaryIndexes(indexNames: string[]): this {
		for (const indexName of indexNames) {
			if (!this.secondaryIndexesMap.has(indexName)) {
				throw new Error(`Secondary index ${indexName} does not exist`);
			}
		}

		this.publicSecondaryIndexNames = [
			...new Set([...this.publicSecondaryIndexNames, ...indexNames])
		];
		return this;
	}

	public setPublicPrimaryIndex(): this {
		this.primaryIndexIsPublic = true;
		return this;
	}

	public setTableName(tableName: string): this {
		if (tableName == null || tableName.length === 0) {
			throw new Error('Table name must be set');
		}

		this.tableName = tableName;
		return this;
	}

	public setDefaultFilters(filters: DynamoFilterElement[]): this {
		this.defaultFilters = filters;
		return this;
	}

	public build(): BalerialDynamoTable {
		return BalerialDynamoTable.create(this);
	}
}
