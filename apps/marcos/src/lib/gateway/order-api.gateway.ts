import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
import type {
	FileType,
	FullOrder,
	OrderStatus,
	File,
	ReportDate,
	DashboardReport
} from '@marcsimolduressonsardina/core/type';

export class OrderApiGateway {
	public static async notifyOrder(orderId: string): Promise<void> {
		await fetch(`/api/orders/${orderId}/notify`, {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	public static async searchOrders(query: string, status: OrderStatus): Promise<FullOrder[]> {
		const response = await fetch(`/api/orders/search`, {
			method: 'POST',
			body: JSON.stringify({ query, status }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const body: { results: FullOrder[] } = await response.json();
		return OrderRepresentationUtilities.hydrateFullOrderDates(body.results);
	}

	public static async getOrderList(
		status: OrderStatus,
		lastKey: Record<string, string | number> | undefined
	): Promise<{ orders: FullOrder[]; nextKey?: Record<string, string | number> }> {
		const listResponse = await fetch('/api/orders/list', {
			method: 'POST',
			body: JSON.stringify({ lastKey, status }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const body: { orders: FullOrder[]; nextKey?: Record<string, string | number> } =
			await listResponse.json();
		body.orders = OrderRepresentationUtilities.hydrateFullOrderDates(body.orders);
		return body;
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
