import type { OrderSet } from '@marcsimolduressonsardina/core/type';
import { BaseApiGateway } from '@/gateway/base-api.gateway';

export class OrderSetApiGateway extends BaseApiGateway {
	public static async createOrderSet(orderIds: string[]): Promise<OrderSet> {
		const response = await this.requestWithErrorHandling<{ orderSet: OrderSet }>(
			'POST',
			'/api/order-sets',
			{ orderIds }
		);

		return { ...response.orderSet, createdAt: new Date(response.orderSet.createdAt) };
	}
}
