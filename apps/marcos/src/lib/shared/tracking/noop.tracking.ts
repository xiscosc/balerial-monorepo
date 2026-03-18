import type { AppUser } from '@marcsimolduressonsardina/core/type';
import type { HandleClientError } from '@sveltejs/kit';
import type { IClientTracking } from './tracking.interface';

export class NoOpTracking implements IClientTracking {
	init(envName: string, appUser?: AppUser) {
		console.log('[tracking:noop] init', envName, appUser);
	}

	identify(appUser: AppUser, envName: string) {
		console.log('[tracking:noop] identify', appUser, envName);
	}

	event(name: string, properties?: Record<string, unknown>) {
		console.log('[tracking:noop] event', name, properties);
	}

	error(error: Error | unknown, properties?: Record<string, unknown>): boolean {
		console.log('[tracking:noop] error', error, properties);
		return true;
	}

	runWhenFeatureIsEnabled(_feature: string, callback: () => void) {
		callback();
	}

	queueError(_error: Error, _source?: string) {}

	flushErrorQueue() {}

	handleFormError(
		result: { error: Error | { message: string } | unknown },
		_source: string,
		onError: (message: string) => void
	) {
		const error =
			result.error instanceof Error ? result.error : new Error(String(result.error));
		const isNetworkError =
			error.message.includes('fetch') ||
			error.message.includes('network') ||
			error.message.includes('timeout');
		onError(
			isNetworkError
				? 'Error de conexión. Comprueba tu internet.'
				: 'Error: ' + error.message
		);
	}

	readonly handleClientError: HandleClientError = async () => {};
}
