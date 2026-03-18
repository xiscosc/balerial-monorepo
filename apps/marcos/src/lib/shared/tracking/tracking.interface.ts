import type { AppUser } from '@marcsimolduressonsardina/core/type';
import type { HandleClientError } from '@sveltejs/kit';

export interface IClientTracking {
	init(envName: string, appUser?: AppUser): void;
	identify(appUser: AppUser, envName: string): void;
	event(name: string, properties?: Record<string, unknown>): void;
	error(error: Error | unknown, properties?: Record<string, unknown>): boolean;
	runWhenFeatureIsEnabled(feature: string, callback: () => void): void;
	queueError(error: Error, source?: string): void;
	flushErrorQueue(): void;
	handleFormError(
		result: { error: Error | { message: string } | unknown },
		source: string,
		onError: (message: string) => void
	): void;
	readonly handleClientError: HandleClientError;
}
