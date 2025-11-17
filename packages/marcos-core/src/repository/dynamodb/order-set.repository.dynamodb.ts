import { BalerialDynamoRepository } from '@balerial/dynamo/repository';
import { OrderSetDto } from '../dto/order-set.dto';
import {
	ICoreConfiguration,
	ICoreConfigurationForAWSLambda
} from '../../configuration/core-configuration.interface';
import { getClientConfiguration } from '../../configuration/configuration.util';
import { OrderSetSecondaryIndexNames, orderSetTableBuilder } from './table/table.builders.dynamodb';

export class OrderSetRepositoryDynamoDb {
	private repository: BalerialDynamoRepository<OrderSetDto>;

	constructor(private readonly config: ICoreConfiguration | ICoreConfigurationForAWSLambda) {
		if (config.orderSetTable == null) {
			throw Error('Table name orderSetTable can not be empty');
		}

		this.repository = new BalerialDynamoRepository(
			getClientConfiguration(config),
			orderSetTableBuilder.setTableName(config.orderSetTable).build()
		);
	}

	public async getOrderSetById(orderSetId: string): Promise<OrderSetDto | null> {
		const dtos = await this.repository.getByIndex({
			partitionKeyValue: orderSetId
		});
		return dtos[0] ?? null;
	}

	public async getOrderSetByHash(hash: string): Promise<OrderSetDto | null> {
		const dtos = await this.repository.getByIndex({
			indexName: OrderSetSecondaryIndexNames.Hash,
			partitionKeyValue: hash
		});
		return dtos[0] ?? null;
	}

	public async createOrderSet(orderSet: OrderSetDto): Promise<void> {
		if (orderSet.hash == null || orderSet.uuid == null || orderSet.orderIds.length === 0) {
			throw new Error('Invalid order set data');
		}

		await this.repository.put(orderSet);
	}
}
