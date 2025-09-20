import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export class BaseApiGateway {
	protected static async requestWithErrorHandling<T>(
		method: string,
		path: string,
		body?: unknown
	): Promise<T> {
		const options: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json'
			}
		};

		if (body) {
			options.body = JSON.stringify(body);
		}

		let response: Response;
		try {
			response = await fetch(path, options);
		} catch (e) {
			console.error('Network Error:', e);
			await goto('/error?status=500');
			throw error(503, 'Server error');
		}

		if (!response.ok) {
			const message = await response.text();
			console.error(`API Error: ${response.status} ${response.statusText}`, message);
			await goto('/error?status=' + response.status);
			throw error(response.status, message || 'API Request Failed');
		}

		// Handle responses that might not have a JSON body
		const responseText = await response.text();
		try {
			// Return parsed JSON if possible
			return JSON.parse(responseText) as T;
		} catch {
			// Otherwise, return the raw text (useful for simple string responses)
			return responseText as unknown as T;
		}
	}
}
