import type { AppUser } from '@marcsimolduressonsardina/core/type';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import type { ServerFeature } from './server.features';

export interface TrackingContext {
	ip: string;
	user_agent: string | null;
	current_url: string;
	path: string;
	referrer: string | null;
}

export interface ServerEventOptions {
	user: AppUser;
	context: TrackingContext;
	properties?: Record<string, unknown>;
	orderId?: string;
	customerId?: string;
}

export interface AnonymousEventOptions {
	context: TrackingContext;
	properties?: Record<string, unknown>;
	orderId?: string;
	customerId?: string;
}

export interface IServerTracking {
	event(name: string, options: ServerEventOptions): void;
	anonymousEvent(name: string, options: AnonymousEventOptions): void;
	error(error: Error | unknown): void;
	isFeatureEnabled(
		feature: ServerFeature,
		options: ServerEventOptions | AnonymousEventOptions
	): Promise<boolean>;
	readonly handleError: HandleServerError;
	readonly contextHandle: Handle;
}
