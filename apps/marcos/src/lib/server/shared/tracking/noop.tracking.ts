import type { Handle, HandleServerError } from '@sveltejs/kit';
import type {
	IServerTracking,
	ServerEventOptions,
	AnonymousEventOptions
} from './tracking.interface';

export class NoOpServerTracking implements IServerTracking {
	event(_name: string, _options: ServerEventOptions) {}

	anonymousEvent(_name: string, _options: AnonymousEventOptions) {}

	error(_error: Error | unknown) {}

	readonly handleError: HandleServerError = () => {};

	readonly contextHandle: Handle = async ({ event, resolve }) => {
		event.locals.posthog = {
			ip: event.getClientAddress(),
			user_agent: event.request.headers.get('user-agent'),
			current_url: event.url.toString(),
			path: event.url.pathname,
			referrer: event.request.headers.get('referer')
		};

		return resolve(event);
	};
}
