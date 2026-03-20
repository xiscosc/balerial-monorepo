import posthog, { type Properties } from 'posthog-js';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { browser } from '$app/environment';
import type { AppUser } from '@marcsimolduressonsardina/core/type';
import type { HandleClientError } from '@sveltejs/kit';
import type { IClientTracking } from './tracking.interface';
import type { ClientFeature } from './client.features';

const QUEUE_KEY = 'posthog_error_queue';
const MAX_QUEUE_SIZE = 50;

interface QueuedError {
	message: string;
	stack?: string;
	timestamp: number;
}

export class PostHogTracking implements IClientTracking {
	init(envName: string, appUser?: AppUser) {
		if (!browser) return;

		posthog.init(PUBLIC_POSTHOG_KEY, {
			api_host: 'https://eu.i.posthog.com',
			person_profiles: 'identified_only',
			autocapture: false,
			loaded: (ph) => {
				ph.register({
					env: envName,
					store: appUser ? appUser.storeId : 'not_available'
				});
			}
		});

		if (appUser) {
			this.identify(appUser, envName);
		}
	}

	identify(appUser: AppUser, envName: string) {
		if (!browser) return;

		posthog.identify(appUser.id, {
			email: appUser.id,
			name: appUser.name,
			userEnv: envName
		});
	}

	event(name: string, properties?: Record<string, unknown>) {
		if (!browser) return;
		posthog.capture(name, properties);
	}

	error(error: Error | unknown, properties?: Record<string, unknown>): boolean {
		if (!browser) return true;

		const err = error instanceof Error ? error : new Error(String(error));
		const result = posthog.captureException(err, properties as Properties);
		return result !== undefined;
	}

	runWhenFeatureIsEnabled(feature: ClientFeature, callback: () => void) {
		if (!browser) return;

		posthog.reloadFeatureFlags();
		posthog.onFeatureFlags(() => {
			if (posthog.isFeatureEnabled(feature)) {
				callback();
			}
		});
	}

	queueError(error: Error, source?: string) {
		if (!browser) return;

		const success = this.error(error, { source, originalStack: error.stack });
		if (success) return;

		const queue = this.getQueue();
		queue.push({ message: error.message, stack: error.stack, timestamp: Date.now() });
		this.saveQueue(queue);
	}

	flushErrorQueue() {
		if (!browser) return;

		const queue = this.getQueue();
		if (queue.length === 0) return;

		const failedItems: QueuedError[] = [];

		queue.forEach((item) => {
			const error = new Error(item.message);
			if (item.stack) error.stack = item.stack;
			const success = this.error(error, {
				queuedAt: item.timestamp,
				wasOffline: true,
				originalStack: item.stack
			});
			if (!success) failedItems.push(item);
		});

		if (failedItems.length === 0) {
			localStorage.removeItem(QUEUE_KEY);
		} else {
			this.saveQueue(failedItems);
		}
	}

	handleFormError(
		result: { error: Error | { message: string } | unknown },
		source: string,
		onError: (message: string) => void
	) {
		const error = result.error instanceof Error ? result.error : new Error(String(result.error));
		const isNetworkError =
			error.message.includes('fetch') ||
			error.message.includes('network') ||
			error.message.includes('timeout');
		this.queueError(error, source);
		onError(
			isNetworkError ? 'Error de conexión. Comprueba tu internet.' : 'Error: ' + error.message
		);
	}

	readonly handleClientError: HandleClientError = async ({ error, status }) => {
		if (status < 500) return;
		const errorToTrack = error instanceof Error ? error : new Error(String(error));
		this.queueError(errorToTrack);
	};

	private getQueue(): QueuedError[] {
		if (!browser) return [];
		try {
			return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
		} catch {
			return [];
		}
	}

	private saveQueue(queue: QueuedError[]) {
		if (!browser) return;
		localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
	}
}
