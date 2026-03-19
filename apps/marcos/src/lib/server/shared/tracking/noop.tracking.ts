import type { Handle, HandleServerError } from '@sveltejs/kit';
import type {
	IServerTracking,
	ServerEventOptions,
	AnonymousEventOptions
} from './tracking.interface';

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

	readonly handleError: HandleServerError = () => { };

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
