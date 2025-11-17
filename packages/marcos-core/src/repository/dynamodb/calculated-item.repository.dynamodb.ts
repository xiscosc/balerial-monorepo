import { BalerialDynamoRepository } from '@balerial/dynamo/repository';
import {
	ICoreConfiguration,
	ICoreConfigurationForAWSLambda
} from '../../configuration/core-configuration.interface';
import type { CalculatedItemDto } from '../dto/calculated-item.dto';
import { calculatedItemTableBuilder } from './table/table.builders.dynamodb';
import { getClientConfiguration } from '../../configuration/configuration.util';

export class CalculatedItemRepositoryDynamoDb {
	private repository: BalerialDynamoRepository<CalculatedItemDto>;

	constructor(config: ICoreConfiguration | ICoreConfigurationForAWSLambda) {
		if (config.calculatedItemTable == null) {
			throw Error('Table name calculatedItemTable can not be empty');
		}

		this.repository = new BalerialDynamoRepository(
			getClientConfiguration(config),
			calculatedItemTableBuilder.setTableName(config.calculatedItemTable).build()
		);
	}

	public async getCalculatedItemById(orderUuid: string): Promise<CalculatedItemDto | null> {
		const dtos = await this.repository.getByIndex({ partitionKeyValue: orderUuid });
		return dtos[0] ?? null;
	}

	public async getCalculatedItemsByIds(
		orderUuids: string[]
	): Promise<Record<string, CalculatedItemDto>> {
		const ids = orderUuids.map((id) => ({ partitionKey: id }));
		const dtos = await this.repository.batchGet(ids);
		const result: Record<string, CalculatedItemDto> = {};
		dtos.forEach((dto) => {
			result[dto.orderUuid] = dto;
		});
		return result;
	}

	public async createCalculatedItem(calculatedItem: CalculatedItemDto) {
		await this.repository.put(calculatedItem);
	}
}
