import { BaseApiGateway } from '@/gateway/base-api.gateway';
import type { Customer } from '@marcsimolduressonsardina/core/type';

export class CustomerApiGateway extends BaseApiGateway {
	public static async searchCustomers(query: string): Promise<Customer[]> {
		const response = await this.requestWithErrorHandling<{ customers: Customer[] }>(
			'POST',
			'/api/customers/search',
			{ query }
		);

		return response.customers;
	}

	public static async getCustomerList(
		lastKey: Record<string, string | number> | undefined
	): Promise<{ customers: Customer[]; lastKey?: Record<string, string | number> }> {
		const body = await this.requestWithErrorHandling<{
			customers: Customer[];
			lastKey?: Record<string, string | number>;
		}>('POST', '/api/customers/list', { lastKey });
		return body;
	}
}
