import type {
	CalculatedItemPart,
	PreCalculatedItemPartRequest
} from '@marcsimolduressonsardina/core/type';

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

	public static async calculatePrice(
		request: PreCalculatedItemPartRequest
	): Promise<{ part?: CalculatedItemPart; errorMessage?: string }> {
		const response = await fetch('/api/prices', {
			method: 'POST',
			body: JSON.stringify(request),
			headers: {
				'content-type': 'application/json'
			}
		});

		if (response.ok) {
			return { part: await response.json() };
		} else {
			if (response.status === 400) {
				const responseJson = await response.json();
				return { errorMessage: responseJson.error };
			} else {
				return {};
			}
		}
	}
}
