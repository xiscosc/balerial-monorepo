import { dev } from '$app/environment';
import { TRACKING_DISABLED } from '$env/static/private';
import type { IServerTracking } from './tracking.interface';
import { PostHogServerTracking } from './posthog.tracking';
import { NoOpServerTracking } from './noop.tracking';

function createServerTracking(): IServerTracking {
	if (dev || TRACKING_DISABLED === 'true') {
		return new NoOpServerTracking();
	}
	return new PostHogServerTracking();
}

export const ServerTracking = createServerTracking();
export type {
	IServerTracking,
	TrackingContext,
	ServerEventOptions,
	AnonymousEventOptions
} from './tracking.interface';
