export class AnalyticsGateway {
	public static async trackExternalOrderCalculation(
		firstTime: boolean,
		total: number
	): Promise<void> {
		const response = await fetch('/api/analytics/external-orders-calculation', {
			method: 'POST',
			body: JSON.stringify({ firstTime, total }),
			headers: {
				'content-type': 'application/json'
			}
		});

		await response.json();
	}
}
