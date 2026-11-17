import { type ICoreConfiguration } from '../../configuration/core-configuration.interface';
import type { OrderAuditTrailEntryDto } from '../dto/order-audit-trail-entry.dto';
import { BalerialDynamoRepository } from '@balerial/dynamo/repository';
import { getClientConfiguration } from '../../configuration/configuration.util';
import {
	orderAuditTrailTableBuilder,
	OrderAuditTrailSecondaryIndexNames
} from './table/table.builders.dynamodb';

export class OrderAuditTrailRepositoryDynamoDb {
	private repository: BalerialDynamoRepository<OrderAuditTrailEntryDto>;

	constructor(config: ICoreConfiguration) {
		if (config.orderAuditTrailTable == null) {
			throw Error('Table name orderAuditTrailTable can not be empty');
		}

		this.repository = new BalerialDynamoRepository(
			getClientConfiguration(config),
			orderAuditTrailTableBuilder.setTableName(config.orderAuditTrailTable).build()
		);
	}

	async createOrderAuditTrailEntry(dto: OrderAuditTrailEntryDto) {
		await this.repository.put(dto);
	}

	async getOrderAuditTrailEntriesForOrder(orderUuid: string): Promise<OrderAuditTrailEntryDto[]> {
		return this.repository.getByIndex({
			indexName: OrderAuditTrailSecondaryIndexNames.Order,
			partitionKeyValue: orderUuid
		});
	}
}
