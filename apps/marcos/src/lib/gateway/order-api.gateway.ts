import { BaseApiGateway } from '@/gateway/base-api.gateway';
import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
import type {
	FileType,
	FullOrder,
	OrderStatus,
	File,
	ReportDate,
	DashboardReport
} from '@marcsimolduressonsardina/core/type';
import type { BatchOperation } from '@/type/api.type';

export class OrderApiGateway extends BaseApiGateway {
	public static async notifyOrder(orderId: string): Promise<void> {
		await fetch(`/api/orders/${orderId}/notify`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	public static async patchOrders(orderIds: string[], operations: BatchOperation[]) {
		await this.requestWithErrorHandling<{ result: string }>('PATCH', '/api/orders', {
			orderIds,
			operations
		});
	}

	public static async searchOrders(query: string, status: OrderStatus): Promise<FullOrder[]> {
		const response = await this.requestWithErrorHandling<{ results: FullOrder[] }>(
			'POST',
			'/api/orders/search',
			{ query, status }
		);

		return OrderRepresentationUtilities.hydrateFullOrderDates(response.results);
	}

	public static async getOrderList(
		status: OrderStatus,
		lastKey: Record<string, string | number> | undefined
	): Promise<{ orders: FullOrder[]; nextKey?: Record<string, string | number> }> {
		const listResponse = await this.requestWithErrorHandling<{
			orders: FullOrder[];
			nextKey?: Record<string, string | number>;
		}>('POST', '/api/orders/list', { lastKey, status });

		return {
			orders: OrderRepresentationUtilities.hydrateFullOrderDates(listResponse.orders),
			nextKey: listResponse.nextKey
		};
	}

	public static async deleteOrderFile(orderId: string, fileId: string): Promise<void> {
		const response = await fetch(`/api/orders/${orderId}/files/${fileId}`, {
			method: 'DELETE',
			headers: {
				'content-type': 'application/json'
			}
		});

		if (response.status !== 200) {
			throw new Error('Error deleting file');
		}
	}

	public static async createOrderFile(
		orderId: string,
		filename: string,
		fileType?: FileType
	): Promise<File> {
		const response = await fetch(`/api/orders/${orderId}/files`, {
			method: 'POST',
			body: JSON.stringify({ filename, fileType }),
			headers: {
				'content-type': 'application/json'
			}
		});

		if (response.status !== 201) {
			throw new Error('Error creating file');
		}

		const file = (await response.json()) as File;
		return file;
	}

	public static async getOrderFile(orderId: string, fileId: string): Promise<File> {
		const response = await fetch(`/api/orders/${orderId}/files/${fileId}`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		if (response.status !== 200) {
			throw new Error('Error getting file');
		}

		const file = (await response.json()) as File;
		return file;
	}

	public static async getOrderData(
		startDate: ReportDate,
		endDate: ReportDate
	): Promise<DashboardReport> {
		const response = await fetch('/api/orders/data', {
			method: 'POST',
			body: JSON.stringify({ startDate, endDate }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const body: DashboardReport = await response.json();
		return body;
	}
}
