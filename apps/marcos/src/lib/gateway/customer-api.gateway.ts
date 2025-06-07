import type { Customer } from '@marcsimolduressonsardina/core/type';

export class CustomerApiGateway {
	public static async searchCustomers(query: string): Promise<Customer[]> {
		const response = await fetch('/api/customers/search', {
			method: 'POST',
			body: JSON.stringify({ query }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const body: { customers: Customer[] } = await response.json();
		return body.customers;
	}

	public static async getCustomerList(
		lastKey: Record<string, string | number> | undefined
	): Promise<{ customers: Customer[]; lastKey?: Record<string, string | number> }> {
		const response = await fetch('/api/customers/list', {
			method: 'POST',
			body: JSON.stringify({ lastKey }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const body: { customers: Customer[]; lastKey?: Record<string, string | number> } =
			await response.json();
		return body;
	}
}
