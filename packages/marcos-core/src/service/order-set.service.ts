import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import {
	ICoreConfiguration,
	ICoreConfigurationForAWSLambda
} from '../configuration/core-configuration.interface';
import { OrderSetRepositoryDynamoDb } from '../repository/dynamodb/order-set.repository.dynamodb';
import { OrderService } from './order.service';
import { FullOrder, OrderSet } from '../types';
import { OrderSetDto } from '../repository/dto/order-set.dto';
import { UserService } from './user.service';

export class OrderSetService {
	private repository: OrderSetRepositoryDynamoDb;
	private orderService: OrderService;

	constructor(
		private readonly config: ICoreConfiguration | ICoreConfigurationForAWSLambda,
		orderService?: OrderService
	) {
		this.repository = new OrderSetRepositoryDynamoDb(config);
		this.orderService = orderService ?? new OrderService(config);
	}

	public async getOrderSetById(orderSetId: string): Promise<OrderSet | null> {
		const dto = await this.repository.getOrderSetById(orderSetId);
		if (dto) {
			const orders = await this.orderService.getFullOrdersByIds(dto.orderIds);
			return OrderSetService.fromDto(dto, orders, this.config.storeId);
		}
		return null;
	}

	public async createOrderSet(orderIds: string[]): Promise<OrderSet> {
		const hash = OrderSetService.getHash(orderIds);
		const orders = await this.orderService.getFullOrdersByIds(orderIds);
		const existingDto = await this.repository.getOrderSetByHash(hash);
		if (existingDto) {
			return OrderSetService.fromDto(existingDto, orders, this.config.storeId);
		}

		const orderSet: OrderSet = {
			id: uuid(),
			hash,
			createdAt: new Date(),
			orders,
			createdBy: this.config.user
		};

		await this.repository.createOrderSet(OrderSetService.toDto(orderSet));
		return orderSet;
	}

	private static fromDto(
		dto: OrderSetDto,
		orders: Record<string, FullOrder>,
		storeId: string
	): OrderSet {
		return {
			id: dto.uuid,
			hash: dto.hash,
			createdAt: new Date(dto.timestamp),
			orders,
			createdBy: UserService.generateStaticUser(dto.userId, dto.userName, storeId)
		};
	}

	private static toDto(orderSet: OrderSet): OrderSetDto {
		return {
			uuid: orderSet.id,
			hash: this.getHash(Object.keys(orderSet.orders)),
			timestamp: Date.parse(orderSet.createdAt.toISOString()),
			userId: orderSet.createdBy.id,
			userName: orderSet.createdBy.name,
			orderIds: Object.keys(orderSet.orders)
		};
	}

	private static getHash(orderIds: string[]): string {
		const list = [...orderIds].sort().join(':');
		return createHash('sha256').update(list, 'utf8').digest('hex');
	}
}
