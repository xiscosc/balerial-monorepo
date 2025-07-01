import type { PreCalculatedItemPartRequest } from '@/type/api.type';
import type { CalculatedItemPart } from '@marcsimolduressonsardina/core/type';

export class PriceApiGateway {
	public static async getUploadMoldParams(): Promise<{ filename: string; url: string }> {
		const response = await fetch('/api/prices/molds/upload', {
			method: 'GET',
			headers: {
				'content-type': 'application/json'
			}
		});

		return await response.json();
	}

	public static async triggerMoldProcessing(filename: string): Promise<boolean> {
		const response = await fetch('/api/prices/molds/upload', {
			method: 'POST',
			body: JSON.stringify({ filename }),
			headers: {
				'content-type': 'application/json'
			}
		});

		if (response.ok) {
			return true;
		} else {
			return false;
		}
	}

	public static async calculatePrices(
		request: PreCalculatedItemPartRequest
	): Promise<{ part?: CalculatedItemPart; key: string; errorMessage?: string }[]> {
		const response = await fetch('/api/prices', {
			method: 'POST',
			body: JSON.stringify(request),
			headers: {
				'content-type': 'application/json'
			}
		});

		return await response.json();
	}
}
