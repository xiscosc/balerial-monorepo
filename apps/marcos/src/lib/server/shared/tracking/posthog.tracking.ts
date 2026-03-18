import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { ENV_NAME } from '$env/static/private';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { isRedirect } from '@sveltejs/kit';
import type {
	IServerTracking,
	TrackingContext,
	ServerEventOptions,
	AnonymousEventOptions
} from './tracking.interface';

export class PostHogServerTracking implements IServerTracking {
	private buildClient() {
		return new PostHog(PUBLIC_POSTHOG_KEY, {
			host: 'https://eu.i.posthog.com',
			disableGeoip: false
		});
	}

	private getContextProperties(context: TrackingContext) {
		return {
			$ip: context.ip,
			$user_agent: context.user_agent,
			$referrer: context.referrer,
			$current_url: context.current_url,
			env: ENV_NAME
		};
	}

	event(name: string, options: ServerEventOptions) {
		const { user, context, properties, orderId, customerId } = options;
		const client = this.buildClient();

		client.capture({
			distinctId: user.id,
			event: name,
			properties: {
				$set: { name: user.name },
				$set_once: { initial_url: '/' },
				...properties,
				orderId,
				customerId,
				...this.getContextProperties(context),
				store: user.storeId
			}
		});

		client.shutdown().catch((error) => {
			console.error('Failed to shutdown PostHog client:', error);
		});
	}

	anonymousEvent(name: string, options: AnonymousEventOptions) {
		if (options.context.user_agent?.toLowerCase().includes('whatsapp')) return;

		const { context, properties, orderId, customerId } = options;
		const client = this.buildClient();
		const distinctId = `${context.ip}-${context.user_agent || 'no-agent'}`;

		client.capture({
			distinctId,
			event: name,
			properties: {
				$set: { name: 'Public user' },
				...properties,
				orderId,
				customerId,
				...this.getContextProperties(context)
			}
		});

		client.shutdown().catch((error) => {
			console.error('Failed to shutdown PostHog client:', error);
		});
	}

	error(error: Error | unknown) {
		try {
			const client = this.buildClient();
			client.captureException(error);
			client.shutdown().catch((e) => {
				console.error('Failed to shutdown PostHog client:', e);
			});
		} catch (e) {
			console.error('Failed to capture exception in PostHog:', e);
		}
	}

	readonly handleError: HandleServerError = ({ error, event, status }) => {
		if (isRedirect(error) || status < 500) return;

		try {
			const client = this.buildClient();
			client.captureException(error, undefined, event);
			client.shutdown().catch((e) => {
				console.error('Failed to shutdown PostHog client:', e);
			});
		} catch (e) {
			console.error('Failed to capture exception in PostHog:', e);
		}
	};

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
