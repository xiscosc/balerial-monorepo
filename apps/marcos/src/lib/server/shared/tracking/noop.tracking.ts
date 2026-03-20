import type { Handle, HandleServerError } from '@sveltejs/kit';
import type {
	IServerTracking,
	ServerEventOptions,
	AnonymousEventOptions
} from './tracking.interface';
import type { ServerFeature } from './server.features';

export class NoOpServerTracking implements IServerTracking {
	event(_name: string, _options: ServerEventOptions) {
		console.log('[tracking:noop] server event', _name, _options);
	}

	anonymousEvent(_name: string, _options: AnonymousEventOptions) {
		console.log('[tracking:noop] server anonymous event', _name, _options);
	}

	error(_error: Error | unknown) {
		console.log('[tracking:noop] server error', _error);
	}

	async isFeatureEnabled(
		_feature: ServerFeature,
		_options: ServerEventOptions | AnonymousEventOptions
	): Promise<boolean> {
		console.log(`[tracking:noop] check if feature is enabled: ${_feature} with options`, _options);
		return false;
	}

	readonly handleError: HandleServerError = () => {};

	readonly contextHandle: Handle = async ({ event, resolve }) => {
		event.locals.trackingContext = {
			ip: event.getClientAddress(),
			user_agent: event.request.headers.get('user-agent'),
			current_url: event.url.toString(),
			path: event.url.pathname,
			referrer: event.request.headers.get('referer')
		};

		return resolve(event);
	};
}
